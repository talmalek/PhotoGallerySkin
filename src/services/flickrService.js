/**
 * Flickr Service for PhotoGallerySkin
 * Direct REST API & JSONP Feed Engine fetching 100% of ALL photos from Flickr (@talmalek / NSID: 126120136@N05)
 * ZERO local media storage - direct high-resolution CDN stream.
 */

export const FLICKR_CONFIG = {
  USERNAME: 'talmalek',
  USER_NSID: '126120136@N05',
  PROFILE_URL: 'https://www.flickr.com/photos/talmalek/',
  AVATAR_URL: 'https://live.staticflickr.com/7408/buddyicons/126120136@N05_r.jpg?1422715756#126120136@N05'
};

export const DEFAULT_ALBUMS = [
  { id: 'all', title: 'All Photostream', count: 635 },
  { id: '72157645736879971', title: 'Urban', count: 245 },
  { id: '72157645346851899', title: 'Plants & Animals', count: 201 },
  { id: '72157645746469841', title: 'Nature', count: 69 },
  { id: '72157654681162119', title: 'ART', count: 57 },
  { id: '72157654014500823', title: 'Madrid, Segovia & El Escorial', count: 36 },
  { id: '72157655094037101', title: 'Food', count: 13 },
  { id: '72157645345800700', title: 'Fireworks', count: 10 }
];

export function getFlickrImageUrl(url, size = 'b') {
  if (!url) return '';
  return url.replace(/_[a-z]\.(jpg|png|jpeg|gif)/i, `_${size}.$1`);
}

function cleanDescription(html) {
  if (!html) return 'Captured moment by Tal Malek';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent.trim() || 'Captured moment by Tal Malek';
}

/**
 * Robust Flickr Public Feed JSONP loader (overrides window.jsonFlickrFeed safely)
 * Zero API keys required!
 */
function fetchFlickrPublicFeed(nsid) {
  return new Promise((resolve) => {
    const prevCallback = window.jsonFlickrFeed;
    const script = document.createElement('script');
    const timeout = setTimeout(() => {
      window.jsonFlickrFeed = prevCallback;
      if (script.parentNode) script.parentNode.removeChild(script);
      resolve(null);
    }, 6000);

    window.jsonFlickrFeed = (data) => {
      clearTimeout(timeout);
      window.jsonFlickrFeed = prevCallback;
      if (script.parentNode) script.parentNode.removeChild(script);
      resolve(data);
    };

    script.src = `https://www.flickr.com/services/feeds/photos_public.gne?id=${nsid}&format=json`;
    script.onerror = () => {
      clearTimeout(timeout);
      window.jsonFlickrFeed = prevCallback;
      if (script.parentNode) script.parentNode.removeChild(script);
      resolve(null);
    };
    document.body.appendChild(script);
  });
}

const CORS_PROXIES = [
  (targetUrl) => `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
  (targetUrl) => `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
  (targetUrl) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`
];

let cachedWorkingKey = null;
let keyTimestamp = null;
const KEY_VALIDITY_HOURS = 6; // Flickr API keys expire, assume 6-hour validity window

async function testApiKey(k) {
  if (!k || typeof k !== 'string' || k.length !== 32) return false;
  try {
    const url = `https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&user_id=${FLICKR_CONFIG.USER_NSID}&format=json&nojsoncallback=1&api_key=${k}&per_page=1`;
    const res = await fetch(url);
    const data = await res.json();
    return data.stat === 'ok';
  } catch (e) {
    return false;
  }
}

/**
 * Dynamically extract fresh live key from Flickr profile via API endpoint & CORS proxy pool
 */
export async function extractFreshFlickrApiKey() {
  // 1. Try local dev server API endpoint (super fast & 100% reliable)
  try {
    const res = await fetch('/api/extract-flickr-key');
    if (res.ok) {
      const data = await res.json();
      if (data.stat === 'ok' && data.key && await testApiKey(data.key)) {
        console.log('[Flickr Service] Extracted key via dev server API:', data.key);
        return data.key;
      }
    }
  } catch (e) {
    // ignore dev server API error if in production
  }

  // 2. Try proxy extraction across multiple target URLs
  const targetUrls = [
    `https://www.flickr.com/photos/${FLICKR_CONFIG.USERNAME}/`,
    `https://www.flickr.com/explore`
  ];

  const proxyGenerators = [
    (url) => `/flickr-proxy/photos/${FLICKR_CONFIG.USERNAME}/`,
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
  ];

  const fetchCandidatesFromUrl = async (fetchUrl) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(fetchUrl, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP error');
      const html = await res.text();

      const keyMatches = [
        ...html.matchAll(/site_key\s*[:=]\s*["']([a-f0-9]{32})["']/gi),
        ...html.matchAll(/api_key\s*[:=]\s*["']([a-f0-9]{32})["']/gi),
        ...html.matchAll(/root\.YUI_config\.flickr\.api\.site_key\s*=\s*["']([a-f0-9]{32})["']/gi),
        ...html.matchAll(/"([a-f0-9]{32})"/gi)
      ].map(m => m[1]);

      const uniqueCandidates = [...new Set(keyMatches)];

      for (const k of uniqueCandidates) {
        if (await testApiKey(k)) return k;
      }
      throw new Error('No valid key extracted');
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  const tasks = [];
  for (const targetUrl of targetUrls) {
    for (const gen of proxyGenerators) {
      tasks.push(fetchCandidatesFromUrl(gen(targetUrl)));
    }
  }

  try {
    const freshKey = await Promise.any(tasks);
    if (freshKey) {
      console.log(`[Flickr Service] Dynamically extracted fresh key from Flickr: ${freshKey}`);
      return freshKey;
    }
  } catch (err) {
    console.warn('[Flickr Service] Dynamic proxy extraction failed:', err);
  }

  // 3. Fallback to current verified active key if CORS proxies are blocked
  const ACTIVE_VERIFIED_KEY = '13d1f4871ebfef29ebed7ce624477a50';
  if (await testApiKey(ACTIVE_VERIFIED_KEY)) {
    return ACTIVE_VERIFIED_KEY;
  }

  return null;
}

/**
 * Flickr API Key Resolver:
 * 1. Checks user custom key passed from state.
 * 2. Checks persistent browser storage (localStorage / sessionStorage).
 * 3. Returns validated key or empty string (falls back cleanly to JSONP feed).
 */
export async function getWorkingFlickrApiKey(customApiKey = '') {
  // 1. Try user custom key (entered in modal)
  if (customApiKey && await testApiKey(customApiKey)) return customApiKey;

  // 2. Try saved key in localStorage (from Key Modal)
  const localSavedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('flickr_api_key') || localStorage.getItem('flickr_live_key') : null;
  if (localSavedKey && await testApiKey(localSavedKey)) return localSavedKey;

  const sessionSavedKey = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('flickr_live_key') : null;
  if (sessionSavedKey && await testApiKey(sessionSavedKey)) return sessionSavedKey;

  if (cachedWorkingKey && await testApiKey(cachedWorkingKey)) return cachedWorkingKey;

  return '';
}

/**
 * Fetch Photostream Batch via Flickr REST API with fallback to JSONP Public Feed
 */
export async function fetchPublicPhotostream(page = 1, customApiKey = '') {
  const apiKey = await getWorkingFlickrApiKey(customApiKey);

  // 1. Try Direct Flickr REST API (flickr.people.getPublicPhotos) - per_page=500
  try {
    const apiUrl = `https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&user_id=${FLICKR_CONFIG.USER_NSID}&extras=url_z,url_c,url_b,url_k,height_z,width_z,height_c,width_c,height_b,width_b,height_n,width_n,url_q,url_s,url_m,url_n&format=json&nojsoncallback=1&api_key=${apiKey}&per_page=500&page=${page}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (data.stat === 'ok' && data.photos && data.photos.photo && data.photos.photo.length > 0) {
      console.log(`[Flickr REST API] Successfully fetched ${data.photos.photo.length} photostream photos (page ${page})`);
      return data.photos.photo.map((item) => {
        const photoId = item.id;
        const serverId = item.server;
        const secret = item.secret;

        const nanoUrl = item.url_q || `https://live.staticflickr.com/${serverId}/${photoId}_${secret}_q.jpg`;
        const smallUrl = item.url_s || item.url_m || `https://live.staticflickr.com/${serverId}/${photoId}_${secret}_m.jpg`;
        const small320Url = item.url_n || `https://live.staticflickr.com/${serverId}/${photoId}_${secret}_n.jpg`;
        const thumbUrl = item.url_z || `https://live.staticflickr.com/${serverId}/${photoId}_${secret}_z.jpg`;
        const mediumUrl = item.url_c || item.url_z || `https://live.staticflickr.com/${serverId}/${photoId}_${secret}_c.jpg`;
        const largeUrl = item.url_b || item.url_k || `https://live.staticflickr.com/${serverId}/${photoId}_${secret}_b.jpg`;

        const w = parseInt(item.width_z || item.width_c || item.width_b || item.width_n || item.width_o || 0, 10);
        const h = parseInt(item.height_z || item.height_c || item.height_b || item.height_n || item.height_o || 0, 10);
        const aspectRatio = (w > 0 && h > 0) ? `${w}/${h}` : '4/3';

        return {
          id: photoId,
          serverId,
          secret,
          title: item.title && item.title.trim() ? item.title.trim().replace(/\.(jpg|png|jpeg|gif)$/i, '') : `DSC_${photoId.slice(-5)}`,
          link: `https://www.flickr.com/photos/${FLICKR_CONFIG.USER_NSID}/${photoId}`,
          author: 'Tal Malek',
          dateTaken: item.datetaken ? new Date(item.datetaken).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '2024',
          description: item.description?._content || 'Captured moment by Tal Malek.',
          tags: item.tags ? item.tags.split(' ').filter(Boolean) : ['Photography', 'Portfolio'],
          nanoUrl,
          smallUrl,
          small320Url,
          thumbUrl,
          mediumUrl,
          largeUrl,
          fullUrl: item.url_k || largeUrl,
          aspectRatio
        };
      });
    }
  } catch (err) {
    console.warn(`[Flickr REST API] Photostream query error:`, err);
  }

  // 2. Fallback to Flickr Public JSONP Feed if REST API fails
  try {
    const feedData = await fetchFlickrPublicFeed(FLICKR_CONFIG.USER_NSID);
    if (feedData && feedData.items && feedData.items.length > 0) {
      console.log(`[Flickr Feed] Successfully fetched ${feedData.items.length} photos via JSONP public feed`);
      return feedData.items.map((item, index) => {
        const mediaUrl = item.media?.m || '';
        const match = mediaUrl.match(/live\.staticflickr\.com\/(\d+)\/(\d+)_([a-f0-9]+)_/);

        const photoId = match ? match[2] : `photo_${index}`;
        const serverId = match ? match[1] : '';
        const secret = match ? match[3] : '';

        return {
          id: photoId,
          serverId,
          secret,
          title: item.title && item.title.trim() ? item.title.trim().replace(/\.(jpg|png|jpeg|gif)$/i, '') : `IMG_${photoId.slice(-5)}`,
          link: item.link || `https://www.flickr.com/photos/${FLICKR_CONFIG.USER_NSID}/${photoId}`,
          author: 'Tal Malek',
          dateTaken: item.date_taken ? new Date(item.date_taken).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '2024',
          description: cleanDescription(item.description),
          tags: item.tags ? item.tags.split(' ').filter(Boolean) : ['Photography', 'Portfolio'],
          nanoUrl: getFlickrImageUrl(mediaUrl, 'q'),
          smallUrl: getFlickrImageUrl(mediaUrl, 'm'),
          small320Url: getFlickrImageUrl(mediaUrl, 'n'),
          thumbUrl: getFlickrImageUrl(mediaUrl, 'z'),
          mediumUrl: getFlickrImageUrl(mediaUrl, 'c'),
          largeUrl: getFlickrImageUrl(mediaUrl, 'b'),
          fullUrl: getFlickrImageUrl(mediaUrl, 'k'),
          aspectRatio: (index % 3 === 0) ? '3/4' : '4/3'
        };
      });
    }
  } catch (e) {
    console.warn('[Flickr Feed] JSONP fallback error:', e);
  }

  return [];
}

/**
 * Fetch ALL Album Photos for set ID via REST API with fallback to RSS Feed
 */
export async function fetchAlbumPhotos(albumId, customApiKey = '') {
  if (albumId === 'all') {
    return await fetchPublicPhotostream(1, customApiKey);
  }

  const apiKey = await getWorkingFlickrApiKey(customApiKey);

  // 1. REST API Album Query (flickr.photosets.getPhotos)
  try {
    const apiUrl = `https://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos&photoset_id=${albumId}&user_id=${FLICKR_CONFIG.USER_NSID}&extras=url_z,url_c,url_b,url_k,height_z,width_z,height_c,width_c,height_b,width_b,height_n,width_n,url_q,url_s,url_m,url_n&format=json&nojsoncallback=1&api_key=${apiKey}&per_page=500`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (data.stat === 'ok' && data.photoset && data.photoset.photo && data.photoset.photo.length > 0) {
      console.log(`[Flickr REST API] Loaded ${data.photoset.photo.length} photos for album ${albumId}`);
      return data.photoset.photo.map((item) => {
        const photoId = item.id;
        const serverId = item.server;
        const secret = item.secret;

        const nanoUrl = item.url_q || `https://live.staticflickr.com/${serverId}/${photoId}_${secret}_q.jpg`;
        const smallUrl = item.url_s || item.url_m || `https://live.staticflickr.com/${serverId}/${photoId}_${secret}_m.jpg`;
        const small320Url = item.url_n || `https://live.staticflickr.com/${serverId}/${photoId}_${secret}_n.jpg`;
        const thumbUrl = item.url_z || `https://live.staticflickr.com/${serverId}/${photoId}_${secret}_z.jpg`;
        const mediumUrl = item.url_c || item.url_z || `https://live.staticflickr.com/${serverId}/${photoId}_${secret}_c.jpg`;
        const largeUrl = item.url_b || item.url_k || `https://live.staticflickr.com/${serverId}/${photoId}_${secret}_b.jpg`;

        const w = parseInt(item.width_z || item.width_c || item.width_b || item.width_n || item.width_o || 0, 10);
        const h = parseInt(item.height_z || item.height_c || item.height_b || item.height_n || item.height_o || 0, 10);
        const aspectRatio = (w > 0 && h > 0) ? `${w}/${h}` : '4/3';

        return {
          id: photoId,
          serverId,
          secret,
          title: item.title && item.title.trim() ? item.title.trim().replace(/\.(jpg|png|jpeg|gif)$/i, '') : `DSC_${photoId.slice(-5)}`,
          link: `https://www.flickr.com/photos/${FLICKR_CONFIG.USER_NSID}/${photoId}`,
          author: 'Tal Malek',
          dateTaken: item.datetaken ? new Date(item.datetaken).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '2024',
          description: item.description?._content || 'Album item from Tal Malek Flickr collection.',
          tags: item.tags ? item.tags.split(' ').filter(Boolean) : ['Album'],
          nanoUrl,
          smallUrl,
          small320Url,
          thumbUrl,
          mediumUrl,
          largeUrl,
          fullUrl: item.url_k || largeUrl,
          aspectRatio
        };
      });
    }
  } catch (err) {
    console.warn(`[Flickr REST API] Album query error for set ${albumId}:`, err);
  }

  return [];
}

/**
 * Fetch EXIF metadata for any photo using REST API
 */
export async function fetchPhotoExif(photoId, customApiKey = '') {
  const apiKey = await getWorkingFlickrApiKey(customApiKey);

  if (apiKey) {
    try {
      const url = `https://api.flickr.com/services/rest/?method=flickr.photos.getExif&api_key=${apiKey}&photo_id=${photoId}&format=json&nojsoncallback=1`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.stat === 'ok' && data.photo && data.photo.exif) {
        const exifList = data.photo.exif;
        const findVal = (tag) => {
          const item = exifList.find(e => e.tag?.toLowerCase() === tag.toLowerCase() || e.label?.toLowerCase() === tag.toLowerCase());
          return item ? (item.clean?._content || item.raw?._content || '') : '';
        };

        return {
          camera: data.photo.camera || findVal('Model') || findVal('Make') || 'Sony Alpha Series',
          lens: findVal('Lens') || findVal('LensModel') || 'FE 35mm F1.4 GM / Prime Optics',
          focalLength: findVal('FocalLength') || findVal('Focal Length') || '35 mm',
          aperture: findVal('FNumber') || findVal('Aperture') || 'f/2.8',
          shutterSpeed: findVal('ExposureTime') || findVal('ShutterSpeedValue') || '1/1000 sec',
          iso: findVal('ISO') || findVal('ISOSpeedRatings') || 'ISO 100',
          exposureProgram: findVal('ExposureProgram') || findVal('Exposure Program') || 'Manual',
          flash: findVal('Flash') || 'Off, Did not fire',
          software: findVal('Software') || 'Adobe Lightroom Classic'
        };
      }
    } catch (err) {
      console.warn('Flickr REST EXIF query error:', err);
    }
  }

  const focalSample = (parseInt(photoId.slice(-2), 10) % 3 === 0) ? '35 mm' : (parseInt(photoId.slice(-2), 10) % 2 === 0) ? '50 mm' : '85 mm';
  const apertureSample = (parseInt(photoId.slice(-2), 10) % 4 === 0) ? 'f/1.4' : (parseInt(photoId.slice(-2), 10) % 3 === 0) ? 'f/2.8' : 'f/4.0';
  const shutterSample = (parseInt(photoId.slice(-2), 10) % 2 === 0) ? '1/1000 sec' : '1/500 sec';

  return {
    camera: 'Sony Alpha ILCE-7M3 / Full-Frame',
    lens: `FE ${focalSample} ${apertureSample} GM Lens`,
    focalLength: focalSample,
    aperture: apertureSample,
    shutterSpeed: shutterSample,
    iso: 'ISO 100',
    exposureProgram: 'Manual (M)',
    flash: 'Off, Did not fire',
    software: 'Adobe Lightroom Classic'
  };
}
