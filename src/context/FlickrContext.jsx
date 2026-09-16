import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchPublicPhotostream, fetchAlbumPhotos, DEFAULT_ALBUMS } from '../services/flickrService';
import { getSavedGoogleAlbums, saveGoogleAlbumsToStorage, fetchGoogleSharedAlbum } from '../services/googlePhotosService';

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

  const setGoogleAlbums = (newAlbums) => {
    setGoogleAlbumsState(newAlbums);
    saveGoogleAlbumsToStorage(newAlbums);
  };
  
  // Lightbox & UI States - Default to CLEAN WHITE THEME (darkMode = false)
  const [activePhoto, setActivePhoto] = useState(null);
  const [viewMode, setViewModeState] = useState(() => {
    const saved = localStorage.getItem('flickr_view_mode');
    return saved || 'masonry';
  });
  const [darkMode, setDarkModeState] = useState(() => localStorage.getItem('flickr_dark_mode') === 'true');

  const setDarkMode = (val) => {
    setDarkModeState(val);
    localStorage.setItem('flickr_dark_mode', val ? 'true' : 'false');
  };

  const setViewMode = (mode) => {
    setViewModeState(mode);
    localStorage.setItem('flickr_view_mode', mode);
  };

  // Toggle dark/light class on root html and body
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (darkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.remove('dark');
      body.classList.add('light');
    }
  }, [darkMode]);

  // Pagination State - Options: 50, 100, 200 (Default: 200)
  const [pageSize, setPageSizeState] = useState(() => {
    const saved = localStorage.getItem('flickr_page_size');
    return saved ? parseInt(saved, 10) : 200;
  });
  const [currentPage, setCurrentPage] = useState(1);

  const setPageSize = (size) => {
    setPageSizeState(size);
    localStorage.setItem('flickr_page_size', size.toString());
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
          const albumData = await fetchGoogleSharedAlbum(targetGoogleAlbum.shareUrl);
          if (albumData && albumData.photos) {
            fetched = albumData.photos;
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

  const filteredPhotos = photos.filter(photo => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = (photo.title || '').toLowerCase().includes(query);
    const tagMatch = Array.isArray(photo.tags) && photo.tags.some(t => t.toLowerCase().includes(query));
    const descMatch = (photo.description || '').toLowerCase().includes(query);
    return titleMatch || tagMatch || descMatch;
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
