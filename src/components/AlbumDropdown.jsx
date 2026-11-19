import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Layers } from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';

export default function AlbumDropdown() {
  const { albums, googleAlbums, activeAlbum, selectAlbum } = useFlickr();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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
      {/* Minimal Architectural Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-stone-100/80 dark:bg-neutral-900/90 hover:bg-stone-200/70 dark:hover:bg-neutral-800/90 transition-colors text-xs sm:text-sm border border-stone-200/90 dark:border-neutral-800 cursor-pointer group"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            isGoogleActive ? 'bg-emerald-500' : 'bg-[#9A6B38] dark:bg-[#C89D5C]'
          }`}
        />
        <span className="text-[#121212] dark:text-[#F2F0EC] font-medium max-w-[150px] sm:max-w-[210px] truncate">
          {currentAlbum.title}
        </span>
        <span className="text-[11px] font-mono text-stone-500 dark:text-neutral-400 tabular-nums">
          {currentAlbum.count}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 dark:text-neutral-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#9A6B38] dark:text-[#C89D5C]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 6, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mt-1 w-80 sm:w-[340px] rounded-xl p-2 shadow-2xl border border-stone-200 dark:border-neutral-800 bg-[#FAF9F6]/98 dark:bg-[#101014]/98 backdrop-blur-2xl z-50 overflow-hidden"
          >
            {/* Flickr Section Header */}
            <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-stone-400 dark:text-neutral-500 flex items-center justify-between border-b border-stone-200/70 dark:border-neutral-800/80 mb-1">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-[#9A6B38] dark:text-[#C89D5C]" />
                Flickr Collections
              </span>
              <span>{albums.length}</span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
              {albums.map((album) => {
                const isSelected = album.id === activeAlbum;
                return (
                  <button
                    key={album.id}
                    type="button"
                    onClick={() => {
                      selectAlbum(album.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs sm:text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#9A6B38]/10 dark:bg-[#C89D5C]/15 text-[#9A6B38] dark:text-[#C89D5C] font-medium'
                        : 'hover:bg-stone-200/50 dark:hover:bg-neutral-800/60 text-stone-700 dark:text-neutral-300'
                    }`}
                  >
                    <span className="truncate">{album.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-stone-400 dark:text-neutral-500 tabular-nums">
                        {album.count}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#9A6B38] dark:text-[#C89D5C]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Google Photos Section Header */}
            {googleAlbums.length > 0 && (
              <>
                <div className="mt-2.5 px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400 flex items-center justify-between border-t border-b border-stone-200/70 dark:border-neutral-800/80 mb-1">
                  <span>Google Photos</span>
                  <span>{googleAlbums.length}</span>
                </div>

                <div className="max-h-44 overflow-y-auto space-y-0.5 pr-0.5">
                  {googleAlbums.map((album) => {
                    const isSelected = album.id === activeAlbum;
                    return (
                      <button
                        key={album.id}
                        type="button"
                        onClick={() => {
                          selectAlbum(album.id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs sm:text-sm transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium'
                            : 'hover:bg-stone-200/50 dark:hover:bg-neutral-800/60 text-stone-700 dark:text-neutral-300'
                        }`}
                      >
                        <span className="truncate">{album.title}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono text-stone-400 dark:text-neutral-500 tabular-nums">
                            {album.count}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
