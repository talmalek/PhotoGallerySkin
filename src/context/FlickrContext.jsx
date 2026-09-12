import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchPublicPhotostream, fetchAlbumPhotos, DEFAULT_ALBUMS } from '../services/flickrService';

const FlickrContext = createContext();

export function FlickrProvider({ children }) {
  const [photos, setPhotos] = useState([]);
  const [albums, setAlbums] = useState(DEFAULT_ALBUMS);
  const [activeAlbum, setActiveAlbum] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('flickr_api_key') || '');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
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

  // Load photos when album or page changes
  const loadPhotos = useCallback(async (albumId, pageNum, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let fetched = [];
      if (albumId === 'all') {
        fetched = await fetchPublicPhotostream(pageNum);
      } else {
        fetched = await fetchAlbumPhotos(albumId, apiKey);
      }

      if (isInitial) {
        setPhotos(fetched);
      } else {
        // Append unique items to existing photos list
        setPhotos(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = fetched.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
      }

      // Check if more items exist
      setHasMore(fetched.length > 0 && (albumId === 'all' || pageNum === 1));
    } catch (err) {
      console.error('Failed to load photos:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [apiKey]);

  // Initial load
  useEffect(() => {
    loadPhotos(activeAlbum, 1, true);
  }, [activeAlbum, loadPhotos]);

  // Album selection handler
  const selectAlbum = (albumId) => {
    if (albumId === activeAlbum) return;
    setActiveAlbum(albumId);
    setPage(1);
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
    return (
      photo.title.toLowerCase().includes(query) ||
      photo.tags.some(t => t.toLowerCase().includes(query)) ||
      photo.description.toLowerCase().includes(query)
    );
  });

  return (
    <FlickrContext.Provider
      value={{
        photos: filteredPhotos,
        allPhotosCount: photos.length,
        albums,
        activeAlbum,
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
        searchQuery,
        setSearchQuery,
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
