import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
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
