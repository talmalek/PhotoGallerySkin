#!/usr/bin/env node
/**
 * scripts/manage-google-albums.mjs
 * CLI helper to add, paginate, and remove Google Photos albums
 * in src/config/googleAlbums.js
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, '../src/config/googleAlbums.js');

function fetchWithRedirect(fetchUrl, maxRedirects = 5) {
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

    https.get(reqOptions, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = new URL(res.headers.location, fetchUrl).href;
        return resolve(fetchWithRedirect(nextUrl, maxRedirects - 1));
      }
      let html = '';
      res.on('data', chunk => html += chunk);
      res.on('end', () => resolve({ html, finalUrl: fetchUrl }));
    }).on('error', reject);
  });
}

function fetchBatch(albumId, pageToken, shareKey) {
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
    }, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
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
}

async function extractAlbum(shareUrl) {
  let cleanUrl = shareUrl.trim();
  if (cleanUrl.includes('photos.app.goo.gl') && !cleanUrl.includes('_imcp=1')) {
    cleanUrl += (cleanUrl.includes('?') ? '&' : '?') + '_imcp=1';
  }

  console.log(`[Google Extractor] Fetching album page: ${cleanUrl}`);
  const { html, finalUrl } = await fetchWithRedirect(cleanUrl);

  let title = 'Google Photos Album';
  const ogTitleMatch = html.match(/<meta property=["']og:title["'] content=["']([^"']+)["']/i);
  if (ogTitleMatch && ogTitleMatch[1]) {
    title = ogTitleMatch[1].replace(/·.*$/, '').replace(/📸.*$/, '').trim();
  }

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
    } catch (e) {
      console.warn('[Google Extractor] ds:1 parse warning:', e.message);
    }
  }

  if (allBaseUrls.length === 0) {
    const matches = [...html.matchAll(/(https:\/\/lh3\.googleusercontent\.com\/pw\/[a-zA-Z0-9_\-]+)/g)].map(m => m[1]);
    allBaseUrls = [...new Set(matches)];
  }

  console.log(`[Google Extractor] Initial batch size: ${allBaseUrls.length}, hasNext: ${!!nextToken}`);

  let batchCount = 1;
  while (nextToken && albumId && shareKey && batchCount <= 25) {
    const batchRes = await fetchBatch(albumId, nextToken, shareKey);
    if (!batchRes.items || batchRes.items.length === 0) break;
    for (const it of batchRes.items) {
      const url = it[1] ? it[1][0] : null;
      if (url) {
        allBaseUrls.push(url);
        if (it[9]) recordVideoMeta(url, it[9]);
      }
    }
    batchCount++;
    console.log(`[Google Extractor] Batch ${batchCount}: fetched ${batchRes.items.length} items (Total: ${allBaseUrls.length})`);
    nextToken = batchRes.nextTok;
  }

  const uniqueUrls = [...new Set(allBaseUrls)];
  console.log(`[Google Extractor] Extraction complete. Total unique photos: ${uniqueUrls.length}`);

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
    title,
    count: photos.length,
    coverUrl: photos[0] ? photos[0].thumbUrl : '',
    photos
  };
}

async function loadExistingAlbums() {
  if (!fs.existsSync(CONFIG_FILE)) return [];
  const content = fs.readFileSync(CONFIG_FILE, 'utf8');
  const match = content.match(/export const DEFAULT_GOOGLE_ALBUMS = (\[[\s\S]*\]);/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error('Error parsing existing albums JSON:', e);
    }
  }
  return [];
}

function saveAlbums(albums) {
  const code = `/**\n * Pre-cached Google Photos Albums\n * Contains public Google Photos shared albums\n */\n\nexport const DEFAULT_GOOGLE_ALBUMS = ${JSON.stringify(albums, null, 2)};\n`;
  fs.writeFileSync(CONFIG_FILE, code, 'utf8');
  console.log(`[Google Extractor] Successfully wrote ${albums.length} albums to ${CONFIG_FILE}`);
}

async function main() {
  const action = process.argv[2]; // 'add' or 'remove'
  const target = process.argv[3]; // shareUrl (for add) or albumId/shareUrl (for remove)

  if (!action || !target) {
    console.error('Usage: node scripts/manage-google-albums.mjs <add|remove> <url|id>');
    process.exit(1);
  }

  const existingAlbums = await loadExistingAlbums();

  if (action === 'add') {
    const albumData = await extractAlbum(target);
    const newAlbum = {
      id: `google_${Date.now()}`,
      title: albumData.title,
      shareUrl: target,
      count: albumData.count,
      coverUrl: albumData.coverUrl,
      source: 'google',
      photos: albumData.photos
    };

    // Replace if shareUrl already exists, or append
    const cleanTarget = target.split('?')[0];
    const filtered = existingAlbums.filter(a => a.shareUrl.split('?')[0] !== cleanTarget);
    filtered.push(newAlbum);

    saveAlbums(filtered);
    console.log(`✓ Added album "${newAlbum.title}" with ${newAlbum.count} photos.`);
  } else if (action === 'remove') {
    const cleanTarget = target.split('?')[0];
    const filtered = existingAlbums.filter(a => a.id !== target && a.shareUrl.split('?')[0] !== cleanTarget);
    const removedCount = existingAlbums.length - filtered.length;
    saveAlbums(filtered);
    console.log(`✓ Removed ${removedCount} album(s) matching "${target}". Remaining: ${filtered.length}.`);
  } else {
    console.error(`Unknown action: ${action}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('[Google Extractor] Fatal error:', err);
  process.exit(1);
});
