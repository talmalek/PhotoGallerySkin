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
          return new Promise((resolve, reject) => {
            if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
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
                return resolve(fetchWithRedirect(redirectUrl, maxRedirects - 1));
              }

              let html = '';
              gRes.on('data', chunk => html += chunk);
              gRes.on('end', () => resolve({ html, finalUrl: fetchUrl }));
            }).on('error', reject);
          });
        };

        const fetchBatch = (albumId, pageToken, shareKey) => {
          return new Promise((resolve) => {
            const payload = [albumId, pageToken, null, shareKey];
            const rpcPayload = [[['snAcKc', JSON.stringify(payload), null, 'generic']]];
            const postData = 'f.req=' + encodeURIComponent(JSON.stringify(rpcPayload));
            const req = https.request('https://photos.google.com/_/PhotosUi/data/batchexecute', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
              }
            }, (bRes) => {
              let b = '';
              bRes.on('data', c => b += c);
              bRes.on('end', () => {
                let items = [];
                let nextTok = null;
                try {
                  const clean = b.replace(/^\)\]\}'/, '').trim();
                  const parsed = JSON.parse(clean);
                  for (const item of parsed) {
                    if (item[0] === 'wrb.fr' && item[1] === 'snAcKc') {
                      const inner = JSON.parse(item[2]);
                      items = inner[1] || [];
                      nextTok = inner[2] || null;
                    }
                  }
                } catch (e) {}
                resolve({ items, nextTok });
              });
            });
            req.on('error', () => resolve({ items: [], nextTok: null }));
            req.write(postData);
            req.end();
          });
        };

        (async () => {
          try {
            const { html, finalUrl } = await fetchWithRedirect(targetUrl);

            // Extract album title
            let title = 'Google Photos Album';
            const ogTitleMatch = html.match(/<meta property=["']og:title["'] content=["']([^"']+)["']/i);
            if (ogTitleMatch && ogTitleMatch[1]) {
              title = ogTitleMatch[1].replace(/·.*$/, '').replace(/📸.*$/, '').trim();
            }

            // Video metadata parser helper
            const videoMetaMap = new Map();
            const recordVideoMeta = (baseUrl, rawMetadataObj) => {
              if (rawMetadataObj && rawMetadataObj['76647426']) {
                const vArr = rawMetadataObj['76647426'];
                const durationMs = typeof vArr[0] === 'number' ? vArr[0] : 0;
                const totalSec = Math.round(durationMs / 1000);
                const mins = Math.floor(totalSec / 60);
                const secs = totalSec % 60;
                videoMetaMap.set(baseUrl, {
                  isVideo: true,
                  durationMs,
                  duration: `${mins}:${secs < 10 ? '0' : ''}${secs}`,
                  width: vArr[2] || 1920,
                  height: vArr[3] || 1080
                });
              }
            };

            // Parse initial items from ds:1 data callback
            let allBaseUrls = [];
            let nextToken = null;
            let albumId = null;
            let shareKey = null;

            const ds1Match = html.match(/AF_initDataCallback\(\s*\{[^{]*key:\s*'ds:1'[^d]*data:([\s\S]*?),\s*sideChannel:/);
            if (ds1Match) {
              try {
                const ds1 = JSON.parse(ds1Match[1]);
                const initialItems = ds1[1] || [];
                nextToken = ds1[2] || null;
                albumId = (ds1[3] && ds1[3][0]) || null;
                const parsedFinal = new URL(finalUrl);
                shareKey = parsedFinal.searchParams.get('key') || (ds1[3] && ds1[3][19]) || null;

                for (const it of initialItems) {
                  const url = it[1] ? it[1][0] : null;
                  if (url) {
                    allBaseUrls.push(url);
                    if (it[9]) recordVideoMeta(url, it[9]);
                  }
                }
              } catch (err) {
                console.warn('[Vite Google Album Extractor] ds:1 parsing error:', err);
              }
            }

            // Fallback: If ds:1 parsing didn't find items, parse from HTML regex
            if (allBaseUrls.length === 0) {
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

              const matches = [...html.matchAll(/(https:\/\/lh3\.googleusercontent\.com\/pw\/[a-zA-Z0-9_\-]+)/g)].map(m => m[1]);
              allBaseUrls = [...new Set(matches)];
            }

            // Loop and paginate all subsequent batches using batchexecute
            let maxBatches = 20; // safety ceiling (up to ~6,000 photos)
            while (nextToken && albumId && shareKey && maxBatches > 0) {
              maxBatches--;
              const batchRes = await fetchBatch(albumId, nextToken, shareKey);
              if (!batchRes.items || batchRes.items.length === 0) break;

              for (const it of batchRes.items) {
                const url = it[1] ? it[1][0] : null;
                if (url) {
                  allBaseUrls.push(url);
                  if (it[9]) recordVideoMeta(url, it[9]);
                }
              }
              nextToken = batchRes.nextTok;
            }

            // Deduplicate URLs while preserving order
            const uniqueUrls = [...new Set(allBaseUrls)];

            const photos = uniqueUrls.map((baseUrl, idx) => {
              const photoId = `gphoto_${idx}`;
              const photoTitle = `${title} - Photo ${idx + 1}`;
              const thumbUrl = `${baseUrl}=w800-h600`;
              const mediumUrl = `${baseUrl}=w1200-h900`;
              const largeUrl = `${baseUrl}=w1600`;
              const fullUrl = `${baseUrl}=w2048`;
              const videoInfo = videoMetaMap.get(baseUrl);
              const isVideo = !!videoInfo;

              return {
                id: photoId,
                title: photoTitle,
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
                aspectRatio: '4/3',
                link: targetUrl,
                author: 'Tal Malek',
                dateTaken: '2024',
                description: `Captured moment from Google Photos album: ${title}`,
                tags: ['Google Photos', title],
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

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              stat: 'ok',
              title,
              count: photos.length,
              coverUrl: photos[0] ? photos[0].thumbUrl : '',
              photos
            }));
          } catch (err) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ stat: 'fail', message: err.message }));
          }
        })();
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
