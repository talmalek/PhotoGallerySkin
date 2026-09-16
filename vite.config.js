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
            gRes.on('end', () => {
              // Extract album title
              let title = 'Google Photos Album';
              const ogTitleMatch = html.match(/<meta property=["']og:title["'] content=["']([^"']+)["']/i);
              if (ogTitleMatch && ogTitleMatch[1]) {
                title = ogTitleMatch[1].replace(/·.*$/, '').replace(/📸.*$/, '').trim();
              }

              // Extract photo CDN URLs
              const matches = [...html.matchAll(/(https:\/\/lh3\.googleusercontent\.com\/pw\/[a-zA-Z0-9_\-]+)/g)].map(m => m[1]);
              const uniqueUrls = [...new Set(matches)];

              const photos = uniqueUrls.map((baseUrl, idx) => {
                const photoId = `gphoto_${idx}`;
                const photoTitle = `${title} - Photo ${idx + 1}`;
                const thumbUrl = `${baseUrl}=w800-h600`;
                const mediumUrl = `${baseUrl}=w1200-h900`;
                const largeUrl = `${baseUrl}=w1600`;
                const fullUrl = `${baseUrl}=w2048`;

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
                  albumTitle: title
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
