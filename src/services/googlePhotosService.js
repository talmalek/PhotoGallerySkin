/**
 * Google Photos Service for PhotoGallerySkin
 * Streams high-resolution photos directly from Google's CDN (lh3.googleusercontent.com)
 * without requiring any visitor login or authentication.
 */

import { DEFAULT_GOOGLE_ALBUMS } from '../config/googleAlbums';

/**
 * Fetch and parse photos from a Google Photos public shared album link
 * e.g., https://photos.app.goo.gl/YYNQbZtzFaubdcQ46
 */
export async function fetchGoogleSharedAlbum(shareUrl) {
  if (!shareUrl) return null;

  // 1. Try local dev server endpoint (fastest & handles Google redirects cleanly)
  try {
    const res = await fetch(`/api/extract-google-album?url=${encodeURIComponent(shareUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.stat === 'ok' && data.photos && data.photos.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[GooglePhotosService] Dev server endpoint error, trying proxy fallback:', err);
  }

  // 2. Fallback to CORS proxy pool for production / static environments
  const cleanUrl = shareUrl.includes('?') ? `${shareUrl}&_imcp=1` : `${shareUrl}?_imcp=1`;
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`
  ];

  for (const proxyUrl of proxies) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const html = await res.text();

        // Extract album title
        let title = 'Google Photos Album';
        const ogTitleMatch = html.match(/<meta property=["']og:title["'] content=["']([^"']+)["']/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
          title = ogTitleMatch[1].replace(/·.*$/, '').replace(/📸.*$/, '').trim();
        }

        // Extract image base URLs
        const matches = [...html.matchAll(/(https:\/\/lh3\.googleusercontent\.com\/pw\/[a-zA-Z0-9_\-]+)/g)].map(m => m[1]);
        const uniqueUrls = [...new Set(matches)];

        if (uniqueUrls.length > 0) {
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
              link: shareUrl,
              author: 'Tal Malek',
              dateTaken: '2024',
              description: `Captured moment from Google Photos album: ${title}`,
              tags: ['Google Photos', title],
              source: 'google',
              albumTitle: title
            };
          });

          return {
            stat: 'ok',
            title,
            count: photos.length,
            coverUrl: photos[0] ? photos[0].thumbUrl : '',
            photos
          };
        }
      }
    } catch (e) {
      // try next proxy
    }
  }

  return null;
}

/**
 * Get active configured Google Photos albums (merges default config + localStorage)
 */
export function getSavedGoogleAlbums() {
  if (typeof localStorage === 'undefined') return DEFAULT_GOOGLE_ALBUMS;
  try {
    const saved = localStorage.getItem('google_photos_albums');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse saved Google albums:', e);
  }
  return DEFAULT_GOOGLE_ALBUMS;
}

/**
 * Save Google Photos albums to localStorage
 */
export function saveGoogleAlbumsToStorage(albums) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('google_photos_albums', JSON.stringify(albums));
}
