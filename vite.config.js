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
