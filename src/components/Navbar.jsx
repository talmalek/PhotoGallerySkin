import React from 'react';
import { motion } from 'framer-motion';
import { Camera, LayoutGrid, Grid, Moon, Sun, ExternalLink } from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';
import AlbumDropdown from './AlbumDropdown';
import { FLICKR_CONFIG } from '../services/flickrService';

export default function Navbar() {
  const {
    viewMode,
    setViewMode,
    darkMode,
    setDarkMode,
    setIsAboutModalOpen
  } = useFlickr();

  return (
    <header className="fixed top-5 left-0 right-0 z-50 px-4 max-w-6xl mx-auto">
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel rounded-2xl px-5 py-3 flex items-center justify-between shadow-lg border border-gray-200/80 dark:border-neutral-800/80"
      >
        {/* Brand Logo */}
        <button
          onClick={() => setIsAboutModalOpen(true)}
          className="flex items-center gap-3 group focus:outline-none cursor-pointer text-left"
          title="About Tal Malek Photography"
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-amber-500/30 shadow-md shadow-amber-500/10 group-hover:scale-105 transition-transform duration-300 bg-neutral-200 shrink-0">
            <img
              src={FLICKR_CONFIG.AVATAR_URL}
              alt="Tal Malek"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                Tal Malek Photography
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                ABOUT
              </span>
            </div>
            <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
              Flickr Stream <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </span>
          </div>
        </button>

        {/* Center / Album Selector Dropdown */}
        <div className="hidden md:flex items-center gap-3">
          <AlbumDropdown />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* View Mode Switcher (Zipper Masonry / Matrix) */}
          <div className="flex items-center bg-gray-100 dark:bg-neutral-900 p-1 rounded-xl border border-gray-200 dark:border-neutral-800">
            <button
              onClick={() => setViewMode('masonry')}
              title="Zipper Masonry View (3 Columns)"
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'masonry' ? 'bg-white dark:bg-neutral-800 text-amber-700 dark:text-amber-400 shadow-sm font-semibold' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden xl:inline text-[11px] font-mono">Masonry</span>
            </button>

            <button
              onClick={() => setViewMode('grid')}
              title="Matrix View (5 Columns)"
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'grid' ? 'bg-white dark:bg-neutral-800 text-amber-700 dark:text-amber-400 shadow-sm font-semibold' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span className="hidden xl:inline text-[11px] font-mono">Matrix</span>
            </button>
          </div>

          {/* Direct Flickr Link */}
          <a
            href={FLICKR_CONFIG.PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Flickr Profile"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-neutral-900 hover:bg-gray-200 text-xs font-mono text-neutral-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-800 transition-all hover:border-amber-500/40"
          >
            <span>Flickr</span>
            <ExternalLink className="w-3 h-3 text-neutral-400" />
          </a>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle Theme"
            className="p-2 rounded-xl glass-panel hover:bg-gray-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-amber-700 border border-gray-200 dark:border-neutral-700/50 transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </motion.div>

      {/* Mobile Album Dropdown Bar */}
      <div className="mt-3 md:hidden flex justify-center">
        <AlbumDropdown />
      </div>
    </header>
  );
}
