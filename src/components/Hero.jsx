import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Search, ArrowDown } from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';
import { FLICKR_CONFIG } from '../services/flickrService';

export default function Hero() {
  const { photos, searchQuery, setSearchQuery, activeAlbum, albums, viewMode, pageSize, currentPage } = useFlickr();

  const marqueeItems = photos.slice(0, 8);
  const currentAlbum = albums.find(a => a.id === activeAlbum) || albums[0];

  const activePageSize = pageSize || 200;
  const startIdx = photos.length > 0 ? (currentPage - 1) * activePageSize + 1 : 0;
  const endIdx = Math.min(photos.length, currentPage * activePageSize);

  return (
    <section className="pt-32 pb-10 px-4 max-w-7xl mx-auto flex flex-col items-center text-center">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-mono mb-6 shadow-sm"
      >
        <img
          src={FLICKR_CONFIG.AVATAR_URL}
          alt="Tal Malek"
          className="w-5 h-5 rounded-full object-cover border border-amber-500/40 shrink-0"
        />
        <span>Tal Malek Photography</span>
        <span className="w-1 h-1 rounded-full bg-amber-500"></span>
        <span className="text-neutral-600 dark:text-neutral-400">Official Portfolio</span>
      </motion.div>

      {/* Main Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 max-w-4xl leading-[1.15]"
      >
        TAL MALEK PHOTOGRAPHY <br className="hidden sm:inline" />
        <span className="font-serif-italic font-normal text-amber-700 dark:text-amber-300 underline decoration-amber-500/30 decoration-wavy underline-offset-8">
          Authentic Frames &amp; Cinematic Portfolio
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-6 text-neutral-600 dark:text-neutral-400 text-base sm:text-lg max-w-2xl font-light leading-relaxed"
      >
        Discover high-resolution photostream and album collections dynamically pulled live from Tal Malek's Flickr portfolio. Pure visual luxury with zero local storage.
      </motion.p>

      {/* Search Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="mt-8 w-full max-w-md relative"
      >
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-neutral-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles, tags, or locations..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl glass-panel text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-all duration-300 shadow-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-xs font-mono text-neutral-400 hover:text-neutral-900"
            >
              Clear
            </button>
          )}
        </div>
      </motion.div>

      {/* Marquee Reel Preview (Masonry View Only) */}
      {viewMode === 'masonry' && marqueeItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 w-full overflow-hidden relative rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-xl py-4 bg-white/70 dark:bg-neutral-950/40 backdrop-blur-md"
        >
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white dark:from-[#09090b] to-transparent z-10 pointer-events-none transition-colors duration-500"></div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white dark:from-[#09090b] to-transparent z-10 pointer-events-none transition-colors duration-500"></div>

          <div className="animate-marquee gap-4 px-4">
            {[...marqueeItems, ...marqueeItems].map((photo, index) => (
              <div
                key={`${photo.id}-${index}`}
                className="w-48 h-32 sm:w-60 sm:h-40 rounded-2xl overflow-hidden relative group shrink-0 border border-gray-200 dark:border-white/10 shadow-md cursor-pointer"
              >
                <img
                  src={photo.thumbUrl}
                  alt={photo.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-end text-left">
                  <span className="text-xs font-bold text-white truncate">{photo.title}</span>
                  <span className="text-[10px] font-mono text-amber-300">{photo.dateTaken}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Active Album Title & Exact Total Count Badge */}
      <div className="mt-12 flex items-center justify-between w-full border-b border-gray-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {currentAlbum.title}
          </h2>
          <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
            {photos.length > activePageSize
              ? `Showing ${startIdx}–${endIdx} of ${photos.length} Photos`
              : `Showing ${photos.length} Photos`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
          <ArrowDown className="w-4 h-4 animate-bounce text-amber-600" />
          <span className="hidden sm:inline">Scroll for Full Collection</span>
        </div>
      </div>
    </section>
  );
}
