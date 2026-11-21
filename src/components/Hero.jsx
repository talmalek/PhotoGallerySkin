import React from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowUpRight, X } from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';

export default function Hero() {
  const {
    photos,
    allPhotosCount,
    searchQuery,
    setSearchQuery,
    activeAlbum,
    albums,
    googleAlbums,
    viewMode,
    pageSize,
    currentPage,
    setIsAboutModalOpen,
    setActivePhoto
  } = useFlickr();

  const marqueeItems = photos.slice(0, 10);
  const currentAlbum =
    albums.find(a => a.id === activeAlbum) ||
    googleAlbums?.find(a => a.id === activeAlbum) ||
    albums[0];

  const isGoogle = currentAlbum.source === 'google' || currentAlbum.id?.startsWith('google_');
  const activePageSize = pageSize || 50;
  const startIdx = photos.length > 0 ? (currentPage - 1) * activePageSize + 1 : 0;
  const endIdx = Math.min(photos.length, currentPage * activePageSize);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <section className="pt-28 md:pt-24 pb-4 max-w-[1600px] mx-auto px-4 sm:px-8">
      {/* Asymmetric Editorial Masthead */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8">
        {/* Left: Editorial Title Flow */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="text-left"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-7 h-[1.5px] bg-[#9A6B38] dark:bg-[#C89D5C]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#9A6B38] dark:text-[#C89D5C] font-medium">
              Photography Archive
            </span>
          </div>

          <h1
            className="font-editorial text-4xl sm:text-5xl lg:text-[3.4rem] font-medium tracking-tight text-[#121212] dark:text-[#F2F0EC] leading-[1.06]"
          >
            {currentAlbum.title}
          </h1>

          <p className="mt-2.5 text-stone-500 dark:text-neutral-400 text-sm sm:text-[15px] max-w-lg font-light leading-relaxed">
            Urban geometry, natural light, and fine art visual studies by Tal Malek.
          </p>
        </motion.div>

        {/* Right: Quiet Search & Archive Metadata */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-start lg:items-end gap-3 w-full lg:w-auto"
        >
          {/* Minimal Hairline Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-stone-400 dark:text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter titles, tags, locations..."
              className="w-full pl-9 pr-9 py-2 rounded-lg bg-stone-100/75 dark:bg-neutral-900/80 border border-stone-200/90 dark:border-neutral-800 text-xs sm:text-sm text-[#121212] dark:text-[#F2F0EC] placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[#9A6B38] dark:focus:border-[#C89D5C] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-[#121212] dark:hover:text-white cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Compact Stats + Portfolio Trigger */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-stone-500 dark:text-neutral-400">
            <span className="tabular-nums">{allPhotosCount || 635} Works</span>
            <span className="text-stone-300 dark:text-neutral-700">·</span>
            <span className="tabular-nums">{albums.length - 1} Series</span>
            <span className="text-stone-300 dark:text-neutral-700">·</span>
            <button
              type="button"
              onClick={() => setIsAboutModalOpen(true)}
              className="inline-flex items-center gap-1 text-[#9A6B38] dark:text-[#C89D5C] hover:underline underline-offset-4 font-medium cursor-pointer"
            >
              <span>About Tal Malek</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Borderless Contact-Sheet Filmstrip (Masonry View Only) */}
      {viewMode === 'masonry' && marqueeItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="relative w-full overflow-hidden py-5 mb-8 border-y border-stone-200/70 dark:border-neutral-800/80"
        >
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#FAF9F6] dark:from-[#08080A] to-transparent z-30 pointer-events-none transition-colors duration-500" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#FAF9F6] dark:from-[#08080A] to-transparent z-30 pointer-events-none transition-colors duration-500" />

          <div className="animate-marquee gap-3.5">
            {[...marqueeItems, ...marqueeItems].map((photo, index) => (
              <button
                key={`${photo.id}-${index}`}
                type="button"
                onClick={() => setActivePhoto(photo)}
                className="w-44 h-28 sm:w-56 sm:h-36 rounded-md overflow-visible relative group hover:z-20 shrink-0 cursor-pointer text-left transition-transform duration-300 hover:scale-[1.03]"
              >
                {/* Dark-Mode Molten Amber / Solar-Eclipse Hover Glow */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none hidden dark:block absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
                >
                  <div
                    className="absolute -inset-2.5 rounded-lg blur-[14px]"
                    style={{
                      background:
                        'radial-gradient(ellipse 85% 55% at 50% 6%, rgba(255,155,40,0.95) 0%, rgba(255,62,0,0.72) 42%, rgba(220,24,0,0.34) 72%, rgba(255,40,0,0.22) 100%)'
                    }}
                  />
                  <div
                    className="absolute -inset-[4px] rounded-md blur-[5px]"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(255,220,130,0.95) 0%, rgba(255,105,15,0.85) 28%, rgba(255,58,0,0.55) 68%, rgba(255,90,20,0.75) 100%)'
                    }}
                  />
                  <div
                    className="absolute -inset-[1.5px] rounded-md"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(255,248,220,1) 0%, rgba(255,132,20,0.95) 22%, rgba(255,64,0,0.78) 65%, rgba(255,115,28,0.9) 100%)'
                    }}
                  />
                </div>

                <div className="relative w-full h-full rounded-md overflow-hidden bg-stone-200/60 dark:bg-neutral-900">
                  <img
                    src={photo.thumbUrl}
                    alt={photo.title}
                    loading={index >= 5 ? 'lazy' : undefined}
                    fetchPriority={index >= 5 ? 'low' : undefined}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2.5 flex flex-col justify-end">
                    <span className="text-[11px] font-medium text-white truncate">{photo.title}</span>
                    <span className="text-[9px] font-mono text-[#C89D5C]">{photo.dateTaken}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Clean Typographic Index Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-stone-200/80 dark:border-neutral-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isGoogle ? 'bg-emerald-500' : 'bg-[#9A6B38] dark:bg-[#C89D5C]'
            }`}
          />
          <span
            className={`text-[11px] font-mono uppercase tracking-[0.18em] font-medium ${
              isGoogle
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-[#9A6B38] dark:text-[#C89D5C]'
            }`}
          >
            {isGoogle ? 'Google Photos Collection' : 'Flickr Collection'}
          </span>
          {searchQuery && (
            <span className="text-[11px] font-mono text-stone-400 dark:text-neutral-500">
              · Filtered by &ldquo;{searchQuery}&rdquo;
            </span>
          )}
        </div>

        <div className="text-[11px] sm:text-xs font-mono text-stone-500 dark:text-neutral-400 tabular-nums shrink-0">
          {photos.length > activePageSize
            ? `${pad(startIdx)}—${pad(endIdx)} / ${photos.length}`
            : `${photos.length} Works`}
        </div>
      </div>
    </section>
  );
}
