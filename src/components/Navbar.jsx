import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  Grid,
  Moon,
  Sun,
  Key,
  Images,
  ExternalLink,
  SlidersHorizontal,
  User
} from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';
import AlbumDropdown from './AlbumDropdown';
import { FLICKR_CONFIG } from '../services/flickrService';

export default function Navbar() {
  const {
    viewMode,
    setViewMode,
    darkMode,
    setDarkMode,
    setIsAboutModalOpen,
    setIsAuthModalOpen,
    setIsGoogleModalOpen
  } = useFlickr();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF9F6]/85 dark:bg-[#08080A]/85 backdrop-blur-xl border-b border-stone-200/80 dark:border-neutral-800/80 transition-colors duration-500">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Monogram & Name */}
        <button
          type="button"
          onClick={() => setIsAboutModalOpen(true)}
          className="flex items-center gap-3 group focus:outline-none cursor-pointer text-left shrink-0"
          title="About Tal Malek"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-300 dark:border-neutral-700 group-hover:border-[#9A6B38] dark:group-hover:border-[#C89D5C] transition-colors bg-neutral-200 shrink-0">
            <img
              src={FLICKR_CONFIG.AVATAR_URL}
              alt="Tal Malek"
              className="w-full h-full object-cover object-[50%_25%]"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-[#121212] dark:text-[#F2F0EC] group-hover:text-[#9A6B38] dark:group-hover:text-[#C89D5C] transition-colors">
              Tal Malek
            </span>
            <span className="text-[10px] font-mono tracking-[0.14em] uppercase text-stone-400 dark:text-neutral-500 hidden sm:block">
              Photography
            </span>
          </div>
        </button>

        {/* Center: Album Selector */}
        <div className="hidden md:flex items-center">
          <AlbumDropdown />
        </div>

        {/* Right Controls: Clean Gallery Actions + Tucked Admin Menu */}
        <div className="flex items-center gap-2">
          {/* View Mode Switcher (Zipper Masonry / Matrix) */}
          <div className="flex items-center bg-stone-100/90 dark:bg-neutral-900 p-0.5 rounded-lg border border-stone-200/80 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setViewMode('masonry')}
              title="Zipper Masonry View"
              className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-mono ${
                viewMode === 'masonry'
                  ? 'bg-white dark:bg-neutral-800 text-[#9A6B38] dark:text-[#C89D5C] shadow-xs font-semibold'
                  : 'text-stone-500 dark:text-neutral-400 hover:text-[#121212] dark:hover:text-[#F2F0EC]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Masonry</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Matrix View"
              className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-mono ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-800 text-[#9A6B38] dark:text-[#C89D5C] shadow-xs font-semibold'
                  : 'text-stone-500 dark:text-neutral-400 hover:text-[#121212] dark:hover:text-[#F2F0EC]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Matrix</span>
            </button>
          </div>

          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to Gallery Paper (Light)' : 'Switch to Darkroom (Dark)'}
            className="p-2 rounded-lg text-stone-600 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-900 border border-transparent hover:border-stone-200/80 dark:hover:border-neutral-800 transition-colors cursor-pointer"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-[#C89D5C]" />
            ) : (
              <Moon className="w-4 h-4 text-stone-600" />
            )}
          </button>

          {/* Compact Settings & Links Menu (keeps admin icons clean & unobtrusive) */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              title="Portfolio & Sources"
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                menuOpen
                  ? 'bg-stone-100 dark:bg-neutral-900 border-stone-300 dark:border-neutral-700 text-[#9A6B38] dark:text-[#C89D5C]'
                  : 'text-stone-600 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-900 border-transparent hover:border-stone-200/80 dark:hover:border-neutral-800'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 6, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 mt-1 w-56 rounded-xl p-1.5 shadow-2xl border border-stone-200 dark:border-neutral-800 bg-[#FAF9F6]/98 dark:bg-[#101014]/98 backdrop-blur-2xl z-50"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsAboutModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-stone-700 dark:text-neutral-200 hover:bg-stone-200/60 dark:hover:bg-neutral-800/70 transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#9A6B38] dark:text-[#C89D5C]" />
                    <span>About Tal Malek</span>
                  </button>

                  <a
                    href={FLICKR_CONFIG.PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-stone-700 dark:text-neutral-200 hover:bg-stone-200/60 dark:hover:bg-neutral-800/70 transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                      <span>Flickr Profile</span>
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">@{FLICKR_CONFIG.USERNAME}</span>
                  </a>

                  <div className="my-1 border-t border-stone-200/70 dark:border-neutral-800" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsGoogleModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-stone-600 dark:text-neutral-300 hover:bg-stone-200/60 dark:hover:bg-neutral-800/70 transition-colors cursor-pointer"
                  >
                    <Images className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Google Photos Albums</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAuthModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-stone-600 dark:text-neutral-300 hover:bg-stone-200/60 dark:hover:bg-neutral-800/70 transition-colors cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5 text-stone-400" />
                    <span>Flickr API Key</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Album Dropdown Bar */}
      <div className="md:hidden pb-2.5 px-4 flex justify-center">
        <AlbumDropdown />
      </div>
    </header>
  );
}
