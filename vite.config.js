import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import https from 'https';

function flickrKeyPlugin() {
  return {
    name: 'flickr-key-extractor',
    configureServer(server) {
      server.middlewares.use('/api/extract-flickr-key', (req, res) => {
        const options = {
          hostname: 'www.flickr.com',
          path: '/photos/talmalek/',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        };

        https.get(options, (flickrRes) => {
          let html = '';
          flickrRes.on('data', chunk => html += chunk);
          flickrRes.on('end', async () => {
            const matches = [
              ...html.matchAll(/site_key\s*[:=]\s*["']([a-f0-9]{32})["']/gi),
              ...html.matchAll(/api_key\s*[:=]\s*["']([a-f0-9]{32})["']/gi),
              ...html.matchAll(/root\.YUI_config\.flickr\.api\.site_key\s*=\s*["']([a-f0-9]{32})["']/gi),
              ...html.matchAll(/"([a-f0-9]{32})"/gi)
            ].map(m => m[1]);

            const candidates = [...new Set(matches)];
            let validKey = null;

            for (const k of candidates) {
              const testUrl = `https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&user_id=126120136@N05&format=json&nojsoncallback=1&api_key=${k}&per_page=1`;
              try {
                const apiRes = await new Promise((resolve, reject) => {
                  https.get(testUrl, (r) => {
                    let body = '';
                    r.on('data', c => body += c);
                    r.on('end', () => resolve(body));
                  }).on('error', reject);
                });
                const data = JSON.parse(apiRes);
                if (data.stat === 'ok') {
                  validKey = k;
                  break;
                }
              } catch (e) {}
            }

            res.setHeader('Content-Type', 'application/json');
            if (validKey) {
              res.end(JSON.stringify({ stat: 'ok', key: validKey }));
            } else {
              res.end(JSON.stringify({ stat: 'fail', message: 'No valid key found' }));
            }
          });
        }).on('error', (err) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ stat: 'fail', message: err.message }));
        });
      });

      server.middlewares.use('/api/extract-google-album', (req, res) => {
        const parsedUrl = new URL(req.url, 'http://localhost:3000');
        let targetUrl = parsedUrl.searchParams.get('url');

        if (!targetUrl) {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ stat: 'fail', message: 'Missing url parameter' }));
        }

        // For photos.app.goo.gl, append ?_imcp=1 to force desktop web response
        if (targetUrl.includes('photos.app.goo.gl') && !targetUrl.includes('_imcp=1')) {
          targetUrl += (targetUrl.includes('?') ? '&' : '?') + '_imcp=1';
        }

        const fetchWithRedirect = (fetchUrl, maxRedirects = 5) => {
          if (maxRedirects <= 0) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ stat: 'fail', message: 'Too many redirects' }));
          }

          const u = new URL(fetchUrl);
          const reqOptions = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
          };

          https.get(reqOptions, (gRes) => {
            if (gRes.statusCode >= 300 && gRes.statusCode < 400 && gRes.headers.location) {
              const redirectUrl = new URL(gRes.headers.location, fetchUrl).href;
              return fetchWithRedirect(redirectUrl, maxRedirects - 1);
            }

            let html = '';
            gRes.on('data', chunk => html += chunk);
            gRes.on('end', async () => {
              // Extract album title
              let title = 'Google Photos Album';
              const ogTitleMatch = html.match(/<meta property=["']og:title["'] content=["']([^"']+)["']/i);
              if (ogTitleMatch && ogTitleMatch[1]) {
                title = ogTitleMatch[1].replace(/·.*$/, '').replace(/📸.*$/, '').trim();
              }

              // Extract share key from final redirected URL for batchexecute metadata RPC
              let shareKey = '';
              try {
                shareKey = new URL(fetchUrl).searchParams.get('key') || '';
              } catch {
                shareKey = '';
              }

              // Parse structured AF_initDataCallback ds:1 items if present
              const parsedItems = [];
              let albumCoverBaseUrl = '';
              const ds1Match = html.match(/AF_initDataCallback\(\{key:\s*'ds:1',\s*hash:\s*'[^']+',\s*data:(\[[\s\S]*?\])\s*,\s*sideChannel:/);
              if (ds1Match && ds1Match[1]) {
                try {
                  const ds1Data = JSON.parse(ds1Match[1]);
                  const ds1Cover = ds1Data?.[3]?.[4]?.[0];
                  if (typeof ds1Cover === 'string' && ds1Cover.startsWith('https://lh3.googleusercontent.com/')) {
                    albumCoverBaseUrl = ds1Cover.replace(/=[^=/?#]+$/, '');
                  }
                  if (Array.isArray(ds1Data?.[1])) {
                    ds1Data[1].forEach((it) => {
                      if (Array.isArray(it) && typeof it[0] === 'string' && typeof it[1]?.[0] === 'string') {
                        parsedItems.push(it);
                      }
                    });
                  }
                } catch {
                  // fall back to regex extraction below
                }
              }

              // Fallback to og:image meta tag for album cover
              if (!albumCoverBaseUrl) {
                const ogImgMatch =
                  html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                  html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
                if (ogImgMatch && ogImgMatch[1]) {
                  const rawCover = ogImgMatch[1].replace(/&amp;/g, '&').trim();
                  albumCoverBaseUrl = rawCover.startsWith('https://lh3.googleusercontent.com/')
                    ? rawCover.replace(/=[^=/?#]+$/, '')
                    : rawCover;
                }
              }

              // Helper to batch-fetch per-photo description/filename via Google Photos fDcn4b RPC
              const fetchBatchMeta = (mediaKeys) => new Promise((resolve) => {
                const map = new Map();
                if (!shareKey || mediaKeys.length === 0) return resolve(map);
                const fReqs = mediaKeys.map((mk, i) => ['fDcn4b', JSON.stringify([mk, 1, shareKey]), null, String(i + 1)]);
                const postBody = new URLSearchParams({ 'f.req': JSON.stringify([fReqs]) }).toString();
                const rpcReq = https.request({
                  hostname: 'photos.google.com',
                  path: '/_/PhotosUi/data/batchexecute?rpcids=fDcn4b',
                  method: 'POST',
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                    'Content-Length': Buffer.byteLength(postBody)
                  }
                }, (rpcRes) => {
                  let body = '';
                  rpcRes.on('data', c => body += c);
                  rpcRes.on('end', () => {
                    for (const line of body.split('\n')) {
                      if (!line.includes('wrb.fr')) continue;
                      try {
                        const arr = JSON.parse(line);
                        for (const entry of arr) {
                          if (Array.isArray(entry) && entry[0] === 'wrb.fr' && entry[2]) {
                            const info = JSON.parse(entry[2]);
                            const row = info?.[0];
                            if (Array.isArray(row) && typeof row[0] === 'string') {
                              map.set(row[0], {
                                description: typeof row[1] === 'string' ? row[1].trim() : '',
                                filename: typeof row[2] === 'string' ? row[2].trim() : '',
                                timestamp: typeof row[3] === 'number' ? row[3] : null,
                                width: typeof row[6] === 'number' ? row[6] : null,
                                height: typeof row[7] === 'number' ? row[7] : null
                              });
                            }
                          }
                        }
                      } catch {
                        // ignore malformed chunks
                      }
                    }
                    resolve(map);
                  });
                });
                rpcReq.on('error', () => resolve(map));
                rpcReq.write(postBody);
                rpcReq.end();
              });

              const metaByKey = new Map();
              if (parsedItems.length > 0 && shareKey) {
                for (let s = 0; s < parsedItems.length; s += 40) {
                  const chunkKeys = parsedItems.slice(s, s + 40).map(it => it[0]);
                  const chunkMeta = await fetchBatchMeta(chunkKeys);
                  chunkMeta.forEach((v, k) => metaByKey.set(k, v));
                }
              }

              // Extract video metadata fallback
              const videoMetaMap = new Map();
              const rawItemMatches = [...html.matchAll(/\["(https:\/\/lh3\.googleusercontent\.com\/pw\/[a-zA-Z0-9_\-]+)",\s*(\d+),\s*(\d+)/g)];
              rawItemMatches.forEach(m => {
                const url = m[1];
                const width = parseInt(m[2], 10);
                const height = parseInt(m[3], 10);
                const startIdx = m.index;
                const chunk = html.substring(startIdx, startIdx + 800);
                const videoMetaMatch = chunk.match(/"76647426":\s*\[(\d+)/);
                if (videoMetaMatch) {
                  const durationMs = parseInt(videoMetaMatch[1], 10);
                  const totalSec = Math.round(durationMs / 1000);
                  const mins = Math.floor(totalSec / 60);
                  const secs = totalSec % 60;
                  videoMetaMap.set(url, {
                    isVideo: true,
                    durationMs,
                    duration: `${mins}:${secs < 10 ? '0' : ''}${secs}`,
                    width,
                    height
                  });
                }
              });

              const sourceList = parsedItems.length > 0
                ? parsedItems.map((it) => ({
                    mediaKey: it[0],
                    baseUrl: it[1][0],
                    width: it[1][1] || 4,
                    height: it[1][2] || 3,
                    timestamp: typeof it[2] === 'number' ? it[2] : null
                  }))
                : [...new Set([...html.matchAll(/(https:\/\/lh3\.googleusercontent\.com\/pw\/[a-zA-Z0-9_\-]+)/g)].map(m => m[1]))].map((baseUrl, i) => ({
                    mediaKey: String(i),
                    baseUrl,
                    width: 4,
                    height: 3,
                    timestamp: null
                  }));

              const photos = sourceList.map((entry, idx) => {
                const { mediaKey, baseUrl } = entry;
                const meta = metaByKey.get(mediaKey) || {};
                const w = meta.width || entry.width || 4;
                const h = meta.height || entry.height || 3;
                const cleanTitle = meta.filename
                  ? meta.filename.replace(/\.(webp|jpg|jpeg|png|gif|heic|mp4|mov)$/i, '').trim()
                  : `${title} - Photo ${idx + 1}`;
                const description = meta.description || `Captured moment from Google Photos album: ${title}`;
                const hashTags = [...description.matchAll(/#([A-Za-z0-9_\-]+)/g)].map(m => m[1]);
                const tags = [...new Set(['Google Photos', title, ...hashTags])];
                const ts = meta.timestamp || entry.timestamp;
                const dateTaken = ts
                  ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '2024';

                const thumbUrl = `${baseUrl}=w800-h600`;
                const mediumUrl = `${baseUrl}=w1200-h900`;
                const largeUrl = `${baseUrl}=w1600`;
                const fullUrl = `${baseUrl}=w2048`;
                const videoInfo = videoMetaMap.get(baseUrl);
                const isVideo = !!videoInfo;

                return {
                  id: `gphoto_${mediaKey}`,
                  mediaKey,
                  title: cleanTitle,
                  nanoUrl: `${baseUrl}=w150-h150-c`,
                  smallUrl: `${baseUrl}=w400-h300`,
                  small320Url: `${baseUrl}=w320`,
                  thumbUrl,
                  mediumUrl,
                  largeUrl,
                  fullUrl,
                  url_s: `${baseUrl}=w600-h600-c`,
                  url_m: mediumUrl,
                  url_b: largeUrl,
                  url_k: fullUrl,
                  url_o: `${baseUrl}=d`,
                  aspectRatio: `${w}/${h}`,
                  link: targetUrl,
                  author: 'Tal Malek',
                  dateTaken,
                  description,
                  tags,
                  source: 'google',
                  albumTitle: title,
                  isVideo,
                  mediaType: isVideo ? 'video' : 'photo',
                  videoUrl: isVideo ? `${baseUrl}=m22` : null,
                  videoFallbackUrl: isVideo ? `${baseUrl}=m18` : null,
                  duration: videoInfo ? videoInfo.duration : null,
                  durationMs: videoInfo ? videoInfo.durationMs : null
                };
              });

              const coverUrl = albumCoverBaseUrl
                ? (albumCoverBaseUrl.startsWith('https://lh3.googleusercontent.com/')
                    ? `${albumCoverBaseUrl}=w800-h600`
                    : albumCoverBaseUrl)
                : (photos[0] ? photos[0].thumbUrl : '');

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                stat: 'ok',
                title,
                count: photos.length,
                coverUrl,
                photos
              }));
            });
          }).on('error', (err) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ stat: 'fail', message: err.message }));
          });
        };

        fetchWithRedirect(targetUrl);
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), flickrKeyPlugin()],
  base: mode === 'production' ? '/PhotoGallerySkin/' : '/',
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/flickr-proxy': {
        target: 'https://www.flickr.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/flickr-proxy/, '')
      }
    }
  }
}));
