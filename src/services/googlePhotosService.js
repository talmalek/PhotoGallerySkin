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

  // 2. Fallback to CORS proxy pool for production / static environments (GitHub Pages)
  const cleanUrl = shareUrl.includes('?') ? `${shareUrl}&_imcp=1` : `${shareUrl}?_imcp=1`;
  const proxies = [
    {
      url: `https://r.jina.ai/${shareUrl}`,
      headers: { 'X-Return-Format': 'html' }
    },
    {
      url: `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`,
      headers: {}
    }
  ];

  for (const proxy of proxies) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(proxy.url, {
        signal: controller.signal,
        headers: proxy.headers || {}
      });
      clearTimeout(timer);

      if (res.ok) {
        const text = await res.text();

        // Extract album title (handles both Jina "Title: ..." and HTML og:title)
        let title = 'Google Photos Album';
        const jinaTitleMatch = text.match(/^Title:\s*([^\n\r]+)/m);
        const ogTitleMatch = text.match(/<meta property=["']og:title["'] content=["']([^"']+)["']/i);
        const rawTitle = jinaTitleMatch ? jinaTitleMatch[1] : (ogTitleMatch ? ogTitleMatch[1] : '');
        if (rawTitle) {
          title = rawTitle.replace(/·.*$/, '').replace(/📸.*$/, '').trim();
        }

        // Extract video metadata (Google Photos embeds video format and duration under 76647426)
        const videoMetaMap = new Map();
        const rawItemMatches = [...text.matchAll(/\["(https:\/\/lh3\.googleusercontent\.com\/pw\/[a-zA-Z0-9_\-]+)",\s*(\d+),\s*(\d+)/g)];
        rawItemMatches.forEach(m => {
          const url = m[1];
          const width = parseInt(m[2], 10);
          const height = parseInt(m[3], 10);
          const startIdx = m.index;
          const chunk = text.substring(startIdx, startIdx + 800);
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

        // Extract image base URLs
        const matches = [...text.matchAll(/(https:\/\/lh3\.googleusercontent\.com\/pw\/[a-zA-Z0-9_\-]+)/g)].map(m => m[1]);
        const uniqueUrls = [...new Set(matches)];

        if (uniqueUrls.length > 0) {
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
              link: shareUrl,
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

// Centralized cloud store endpoint for cross-device album synchronization
const CENTRAL_STORAGE_URL = 'https://kvdb.io/6NWVNGFdq5TnAtvXyZzRKb/google_albums';

/**
 * Fetch centralized Google Photos albums (shared across all devices)
 */
export async function fetchCentralGoogleAlbums() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(CENTRAL_STORAGE_URL, {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (e) {
    console.warn('[GooglePhotosService] Could not fetch central albums from cloud store:', e);
  }
  return null;
}

/**
 * Save centralized Google Photos albums to cloud store (syncs to all devices)
 */
export async function saveCentralGoogleAlbums(albums) {
  // Always save to localStorage immediately for instant local persistence
  saveGoogleAlbumsToStorage(albums);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(CENTRAL_STORAGE_URL, {
      method: 'POST',
      body: JSON.stringify(albums),
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    clearTimeout(timer);
    return res.ok;
  } catch (e) {
    console.warn('[GooglePhotosService] Failed to sync albums to central cloud store:', e);
    return false;
  }
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
      if (Array.isArray(parsed)) {
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
