import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Folder, Check, Sparkles, Layers } from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';

export default function AlbumDropdown() {
  const { albums, googleAlbums, activeAlbum, selectAlbum, setIsGoogleModalOpen } = useFlickr();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Search across both Flickr and Google albums
  const currentAlbum = 
    albums.find(a => a.id === activeAlbum) || 
    googleAlbums.find(a => a.id === activeAlbum) || 
    albums[0];

  const isGoogleActive = currentAlbum?.source === 'google' || currentAlbum?.id?.startsWith('google_');

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative z-40" ref={dropdownRef}>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl glass-panel hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all duration-300 text-sm font-medium border border-gray-200/80 dark:border-neutral-700/50 shadow-md cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <Layers className={`w-4 h-4 group-hover:rotate-12 transition-transform duration-300 ${
            isGoogleActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          }`} />
          <span className="text-neutral-500 dark:text-neutral-400 text-xs font-mono uppercase tracking-wider hidden sm:inline">
            {isGoogleActive ? 'Google:' : 'Flickr:'}
          </span>
          <span className="text-neutral-900 dark:text-neutral-100 font-bold max-w-[160px] sm:max-w-[200px] truncate">
            {currentAlbum.title}
          </span>
        </div>

        {/* Total Album Count Badge */}
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono border font-bold ${
          isGoogleActive
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
        }`}>
          {currentAlbum.count} Photos
        </span>

        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-600' : ''}`} />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 sm:left-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel p-2 shadow-2xl border border-gray-200 dark:border-neutral-700/60 backdrop-blur-2xl z-50 overflow-hidden bg-white/95 dark:bg-neutral-900/95"
          >
            {/* Flickr Section Header */}
            <div className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 mb-1">
              <span>📷 Flickr Photostream &amp; Albums</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {albums.map((album) => {
                const isSelected = album.id === activeAlbum;
                return (
                  <motion.button
                    key={album.id}
                    whileHover={{ x: 3 }}
                    onClick={() => {
                      selectAlbum(album.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30'
                        : 'hover:bg-gray-100 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Folder className={`w-4 h-4 ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-400'}`} />
                      <span className="truncate">{album.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400 bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-700">
                        {album.count}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Google Photos Section Header */}
            <div className="mt-3 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between border-t border-b border-gray-100 dark:border-neutral-800 mb-1">
              <span>🖼️ Google Photos Albums</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                {googleAlbums.length}
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {googleAlbums.map((album) => {
                const isSelected = album.id === activeAlbum;
                return (
                  <motion.button
                    key={album.id}
                    whileHover={{ x: 3 }}
                    onClick={() => {
                      selectAlbum(album.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/30'
                        : 'hover:bg-gray-100 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Folder className={`w-4 h-4 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-500/60'}`} />
                      <span className="truncate">{album.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {album.count}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Quick Manage Google Albums Button */}
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsGoogleModalOpen(true);
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-gray-50 dark:bg-neutral-800 hover:bg-emerald-500/10 text-neutral-600 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-dashed border-gray-200 dark:border-neutral-700"
              >
                <span>⚙️ Manage Google Photos Albums</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
