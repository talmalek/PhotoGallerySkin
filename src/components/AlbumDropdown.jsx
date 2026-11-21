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
      {/* Unified Optical-Instrument Capsule Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center gap-2 pl-3.5 pr-3 py-1.5 rounded-full text-xs border transition-all duration-300 cursor-pointer group ${
          isOpen
            ? 'bg-white dark:bg-[#141110] border-[#9A6B38]/60 dark:border-[#FF7A18]/75 shadow-sm dark:shadow-[0_0_22px_rgba(255,95,15,0.42),inset_0_0_12px_rgba(255,140,40,0.16)]'
            : 'bg-stone-100/85 dark:bg-[#101014]/90 border-stone-200/90 dark:border-white/10 hover:bg-white dark:hover:bg-[#141110] hover:border-[#9A6B38]/45 dark:hover:border-[#FF7A18]/65 dark:hover:shadow-[0_0_18px_rgba(255,95,15,0.34),inset_0_0_10px_rgba(255,130,30,0.12)]'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 transition-shadow duration-300 ${
            isGoogleActive
              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.75)]'
              : 'bg-[#9A6B38] dark:bg-[#FF8C2A] dark:shadow-[0_0_9px_rgba(255,122,24,0.95)]'
          }`}
        />
        <span className="text-[#121212] dark:text-[#F5F2EC] font-medium tracking-wide max-w-[155px] sm:max-w-[220px] truncate">
          {currentAlbum.title}
        </span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums bg-stone-200/70 dark:bg-white/[0.06] text-stone-600 dark:text-[#FFB35C]/90 border border-stone-300/50 dark:border-[#FF7A18]/20">
          {currentAlbum.count}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 dark:text-neutral-400 group-hover:text-[#9A6B38] dark:group-hover:text-[#FFB35C] transition-all duration-200 ${
            isOpen ? 'rotate-180 text-[#9A6B38] dark:text-[#FFB35C]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 10, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 -translate-x-1/2 mt-1 w-80 sm:w-[348px] max-h-[85vh] flex flex-col rounded-2xl p-2 shadow-2xl border border-stone-200 dark:border-[#FF7A18]/30 bg-[#FAF9F6]/98 dark:bg-[#0D0D11]/95 dark:shadow-[0_24px_56px_-12px_rgba(0,0,0,0.92),0_0_26px_rgba(255,95,15,0.2)] backdrop-blur-2xl z-50 overflow-hidden"
          >
            {/* Subtle top molten ember hairline (Dark Mode) */}
            <div
              aria-hidden="true"
              className="pointer-events-none hidden dark:block absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent via-[#FF8C2A]/85 to-transparent"
            />

            {/* Flickr Section Header */}
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 dark:text-neutral-400 flex items-center justify-between border-b border-stone-200/70 dark:border-white/[0.07] mb-1.5 shrink-0">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-[#9A6B38] dark:text-[#FF8C2A]" />
                Flickr Collections
              </span>
              <span className="text-[#9A6B38] dark:text-[#FFB35C]">{albums.length}</span>
            </div>

            <div className="max-h-52 overflow-y-auto dropdown-scroll space-y-1 pr-1.5 overscroll-contain">
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm transition-all duration-200 cursor-pointer border ${
                      isSelected
                        ? 'bg-[#9A6B38]/10 dark:bg-[#FF7A18]/15 border-[#9A6B38]/25 dark:border-[#FF7A18]/40 text-[#9A6B38] dark:text-[#FFB35C] font-medium dark:shadow-[0_0_14px_rgba(255,95,15,0.18)]'
                        : 'border-transparent hover:bg-stone-200/55 dark:hover:bg-[#FF7A18]/[0.08] dark:hover:border-[#FF7A18]/25 text-stone-700 dark:text-neutral-300 dark:hover:text-[#FFF3E0]'
                    }`}
                  >
                    <span className="truncate">{album.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-stone-400 dark:text-neutral-500 tabular-nums">
                        {album.count}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#9A6B38] dark:text-[#FF8C2A]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Google Photos Section Header */}
            {googleAlbums.length > 0 && (
              <>
                <div className="mt-2.5 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400 flex items-center justify-between border-t border-b border-stone-200/70 dark:border-white/[0.07] mb-1.5 shrink-0">
                  <span>Google Photos</span>
                  <span>{googleAlbums.length}</span>
                </div>

                <div className="max-h-48 overflow-y-auto dropdown-scroll space-y-1 pr-1.5 overscroll-contain">
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
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm transition-all duration-200 cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-medium'
                            : 'border-transparent hover:bg-stone-200/55 dark:hover:bg-white/[0.06] text-stone-700 dark:text-neutral-300'
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
