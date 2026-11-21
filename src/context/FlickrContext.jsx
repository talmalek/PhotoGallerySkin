import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchPublicPhotostream, fetchAlbumPhotos, DEFAULT_ALBUMS } from '../services/flickrService';
import {
  getSavedGoogleAlbums,
  saveGoogleAlbumsToStorage,
  fetchGoogleSharedAlbum,
  fetchCentralGoogleAlbums,
  saveCentralGoogleAlbums
} from '../services/googlePhotosService';

const FlickrContext = createContext();

export function FlickrProvider({ children }) {
  const [photos, setPhotos] = useState([]);
  const [albums, setAlbums] = useState(DEFAULT_ALBUMS);
  const [googleAlbums, setGoogleAlbumsState] = useState(() => getSavedGoogleAlbums());
  const [activeAlbum, setActiveAlbum] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('flickr_api_key') || '');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // Sync with central cloud store on startup so every device sees the latest albums
  useEffect(() => {
    fetchCentralGoogleAlbums().then((remoteAlbums) => {
      if (remoteAlbums && Array.isArray(remoteAlbums)) {
        setGoogleAlbumsState(remoteAlbums);
        saveGoogleAlbumsToStorage(remoteAlbums);
      }
    });
  }, []);

  const setGoogleAlbums = (newAlbums) => {
    setGoogleAlbumsState(newAlbums);
    return saveCentralGoogleAlbums(newAlbums);
  };
  
  // Lightbox & UI States - Synchronized with <meta name="color-scheme"> and system preference
  const [activePhoto, setActivePhoto] = useState(null);
  const [viewMode, setViewModeState] = useState('masonry');
  const [colorSchemeOverride, setColorSchemeOverride] = useState(() => {
    try {
      const stored = localStorage.getItem('color-scheme');
      if (stored === 'light' || stored === 'dark') return stored;
      const legacy = localStorage.getItem('flickr_dark_mode');
      if (legacy === 'true') return 'dark';
      if (legacy === 'false') return 'light';
    } catch {
      // Ignore storage access errors
    }
    return null;
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  const darkMode = colorSchemeOverride ? colorSchemeOverride === 'dark' : systemPrefersDark;

  const setDarkMode = useCallback((val) => {
    const target = val ? 'dark' : 'light';
    const currentSystem = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

    if (target === currentSystem) {
      setColorSchemeOverride(null);
      try {
        localStorage.removeItem('color-scheme');
        localStorage.removeItem('flickr_dark_mode');
      } catch {
        // Ignore storage access errors
      }
    } else {
      setColorSchemeOverride(target);
      try {
        localStorage.setItem('color-scheme', target);
        localStorage.removeItem('flickr_dark_mode');
      } catch {
        // Ignore storage access errors
      }
    }
  }, []);

  const setViewMode = (mode) => {
    setViewModeState(mode);
    localStorage.setItem('flickr_view_mode', mode);
  };

  // Track OS scheme changes and cross-tab storage updates without retroactively erasing pinned overrides
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e) => setSystemPrefersDark(e.matches);
    const handleStorage = (e) => {
      if (e.key === 'color-scheme') {
        setColorSchemeOverride(e.newValue === 'light' || e.newValue === 'dark' ? e.newValue : null);
      }
    };
    mq.addEventListener('change', handleMediaChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      mq.removeEventListener('change', handleMediaChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Synchronize <meta name="color-scheme"> and root classes
  useEffect(() => {
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.content = colorSchemeOverride ?? 'light dark';
    }
    const root = document.documentElement;
    const body = document.body;
    root.classList.toggle('dark', darkMode);
    root.classList.toggle('light', !darkMode);
    body.classList.toggle('dark', darkMode);
    body.classList.toggle('light', !darkMode);
  }, [colorSchemeOverride, darkMode]);

  // Pagination State - Options: 50, 100, 200 (Default: 50)
  const [pageSize, setPageSizeState] = useState(() => {
    localStorage.removeItem('flickr_page_size');
    const saved = localStorage.getItem('flickr_page_size_v2');
    const parsed = saved ? parseInt(saved, 10) : 50;
    return [50, 100, 200].includes(parsed) ? parsed : 50;
  });
  const [currentPage, setCurrentPage] = useState(1);

  const setPageSize = (size) => {
    setPageSizeState(size);
    localStorage.setItem('flickr_page_size_v2', size.toString());
    setCurrentPage(1);
  };

  // Load photos when album changes
  const loadPhotos = useCallback(async (albumId, isInitial = false) => {
    setLoading(true);

    try {
      let fetched = [];

      // Check if this is a Google Photos album
      const isGoogle = albumId?.startsWith('google_') || googleAlbums.some(a => a.id === albumId);
      if (isGoogle) {
        const targetGoogleAlbum = googleAlbums.find(a => a.id === albumId);
        if (targetGoogleAlbum) {
          if (targetGoogleAlbum.photos && targetGoogleAlbum.photos.length > 0) {
            fetched = targetGoogleAlbum.photos;
          } else {
            const albumData = await fetchGoogleSharedAlbum(targetGoogleAlbum.shareUrl);
            if (albumData && albumData.photos) {
              fetched = albumData.photos;
            }
          }
        }
      } else if (albumId === 'all') {
        // Fetch full photostream in parallel batches (635 photos total)
        const [batch1, batch2] = await Promise.all([
          fetchPublicPhotostream(1, apiKey),
          fetchPublicPhotostream(2, apiKey)
        ]);
        const existingIds = new Set();
        fetched = [...batch1, ...batch2].filter(p => {
          if (existingIds.has(p.id)) return false;
          existingIds.add(p.id);
          return true;
        });
      } else {
        fetched = await fetchAlbumPhotos(albumId, apiKey);
      }

      setPhotos(fetched);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to load photos:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [apiKey, googleAlbums]);

  // Initial load
  useEffect(() => {
    loadPhotos(activeAlbum, true);
  }, [activeAlbum, loadPhotos]);

  // Album selection handler
  const selectAlbum = (albumId) => {
    if (albumId === activeAlbum) return;
    setActiveAlbum(albumId);
    setCurrentPage(1);
    setPhotos([]);
  };

  // Infinite Scroll Trigger
  const loadNextPage = () => {
    if (loading || loadingMore || !hasMore || activeAlbum !== 'all') return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadPhotos('all', nextPage, false);
  };

  // API Key update handler
  const saveApiKey = (key) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('flickr_api_key', key);
    } else {
      localStorage.removeItem('flickr_api_key');
    }
    loadPhotos(activeAlbum, 1, true);
  };

  // Lightbox Navigation
  const navigateLightbox = (direction) => {
    if (!activePhoto) return;
    const currentIndex = photos.findIndex(p => p.id === activePhoto.id);
    if (currentIndex === -1) return;

    if (direction === 'next' && currentIndex < photos.length - 1) {
      setActivePhoto(photos[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setActivePhoto(photos[currentIndex - 1]);
    }
  };

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredPhotos = photos.filter(photo => {
    const trimmed = (searchQuery || '').trim().toLowerCase();
    if (!trimmed) return true;
    const terms = trimmed.split(/\s+/).filter(Boolean);
    const haystack = [
      photo.title || '',
      photo.description || '',
      photo.dateTaken || '',
      photo.albumTitle || '',
      Array.isArray(photo.tags) ? photo.tags.join(' ') : ''
    ]
      .join(' ')
      .toLowerCase();
    return terms.every(term => haystack.includes(term));
  });

  return (
    <FlickrContext.Provider
      value={{
        photos: filteredPhotos,
        allPhotosCount: photos.length,
        albums,
        googleAlbums,
        setGoogleAlbums,
        activeAlbum,
        setActiveAlbum,
        selectAlbum,
        loading,
        loadingMore,
        loadNextPage,
        hasMore,
        activePhoto,
        setActivePhoto,
        navigateLightbox,
        viewMode,
        setViewMode,
        darkMode,
        setDarkMode,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isGoogleModalOpen,
        setIsGoogleModalOpen,
        isAboutModalOpen,
        setIsAboutModalOpen,
        searchQuery,
        setSearchQuery,
        pageSize,
        setPageSize,
        currentPage,
        setCurrentPage,
        apiKey,
        saveApiKey
      }}
    >
      {children}
    </FlickrContext.Provider>
  );
}

export function useFlickr() {
  const context = useContext(FlickrContext);
  if (!context) {
    throw new Error('useFlickr must be used within a FlickrProvider');
  }
  return context;
}
