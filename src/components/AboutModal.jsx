import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Camera, ArrowUpRight } from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';
import { FLICKR_CONFIG, DEFAULT_ALBUMS } from '../services/flickrService';

export default function AboutModal() {
  const { isAboutModalOpen, setIsAboutModalOpen, photos, selectAlbum } = useFlickr();

  const totalPhotosCount = photos.length > 0 ? photos.length : 635;

  useEffect(() => {
    if (!isAboutModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsAboutModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAboutModalOpen, setIsAboutModalOpen]);

  const handleSelectCollection = (albumId) => {
    selectAlbum(albumId);
    setIsAboutModalOpen(false);
  };

  return (
    <AnimatePresence>
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl overflow-y-auto">
          {/* Overlay Backdrop Click */}
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setIsAboutModalOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-5xl rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl relative overflow-hidden my-auto z-10 bg-white dark:bg-[#0d0d10] text-neutral-900 dark:text-neutral-100 grid grid-cols-1 md:grid-cols-12"
          >
            {/* Top-Right Close Button */}
            <button
              onClick={() => setIsAboutModalOpen(false)}
              className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/55 hover:bg-black/80 text-white/90 hover:text-white backdrop-blur-md border border-white/15 transition-all cursor-pointer shadow-lg"
              title="Close Portfolio"
              aria-label="Close Portfolio"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Column: Editorial Portfolio Content */}
            <div className="md:col-span-7 p-7 sm:p-10 lg:p-12 flex flex-col justify-between order-2 md:order-1">
              <div>
                {/* Eyebrow */}
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-8 h-[1.5px] bg-amber-600 dark:bg-amber-400" />
                  <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-amber-700 dark:text-amber-400 font-semibold">
                    Photographer &amp; Visual Artist
                  </span>
                </div>

                {/* Display Name & Handle */}
                <div className="mb-6">
                  <h2 className="text-4xl sm:text-5xl font-serif font-semibold tracking-tight text-neutral-950 dark:text-white leading-[1.05]">
                    Tal Malek
                  </h2>
                  <p className="mt-2.5 text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>@{FLICKR_CONFIG.USERNAME}</span>
                    <span className="text-neutral-300 dark:text-neutral-700">•</span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Portfolio Stream
                    </span>
                  </p>
                </div>

                {/* Artist Statement Quote */}
                <blockquote className="border-l-2 border-amber-500/70 pl-4 py-0.5 mb-5">
                  <p className="text-base sm:text-lg font-serif-italic text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    &ldquo;Capturing authentic frames where light, geometry, and visual harmony converge.&rdquo;
                  </p>
                </blockquote>

                {/* Concise Bio */}
                <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-light">
                  <p>
                    Welcome to my official photography portfolio. My work explores urban architecture, natural landscapes, botanical and wildlife studies, and fine art visual compositions.
                  </p>
                  <p>
                    Every frame streams directly from high-resolution Flickr and Google Photos collections for an uncompressed, authentic viewing experience.
                  </p>
                </div>

                {/* Metrics Strip */}
                <div className="grid grid-cols-3 gap-4 py-5 my-6 border-y border-neutral-200/80 dark:border-neutral-800/90">
                  <div>
                    <span className="block text-2xl font-bold tracking-tight text-neutral-950 dark:text-white font-mono">
                      {totalPhotosCount}+
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
                      Published Works
                    </span>
                  </div>
                  <div className="border-x border-neutral-200/80 dark:border-neutral-800/90 px-4">
                    <span className="block text-2xl font-bold tracking-tight text-neutral-950 dark:text-white font-mono">
                      {DEFAULT_ALBUMS.length - 1}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
                      Curated Series
                    </span>
                  </div>
                  <div className="pl-1">
                    <span className="block text-2xl font-bold tracking-tight text-neutral-950 dark:text-white font-mono">
                      100%
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
                      Authentic EXIF
                    </span>
                  </div>
                </div>

                {/* Curated Collections */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500 block mb-2.5">
                    Selected Series
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_ALBUMS.slice(1).map((album) => (
                      <button
                        key={album.id}
                        type="button"
                        onClick={() => handleSelectCollection(album.id)}
                        className="group inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-mono bg-neutral-100 dark:bg-neutral-900 hover:bg-amber-500/15 dark:hover:bg-amber-500/15 text-neutral-700 dark:text-neutral-300 hover:text-amber-800 dark:hover:text-amber-300 border border-neutral-200/80 dark:border-neutral-800 hover:border-amber-500/30 transition-all cursor-pointer"
                      >
                        <span>{album.title}</span>
                        <span className="text-neutral-400 dark:text-neutral-500 text-[10px]">({album.count})</span>
                        <ArrowUpRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Row */}
              <div className="mt-8 pt-6 border-t border-neutral-200/80 dark:border-neutral-800/90 flex flex-col sm:flex-row items-center gap-3">
                <a
                  href={FLICKR_CONFIG.PROFILE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl bg-neutral-950 dark:bg-amber-500 hover:bg-neutral-800 dark:hover:bg-amber-400 text-white dark:text-neutral-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer"
                >
                  <span>Visit Flickr Profile</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setIsAboutModalOpen(false)}
                  className="w-full sm:w-auto py-3 px-6 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-sm transition-colors border border-neutral-200 dark:border-neutral-800 cursor-pointer"
                >
                  Explore Gallery
                </button>
              </div>
            </div>

            {/* Right Column: Full-Bleed Editorial Portrait */}
            <div className="md:col-span-5 relative bg-[#060608] min-h-[320px] sm:min-h-[380px] md:min-h-full order-1 md:order-2 overflow-hidden">
              <img
                src={FLICKR_CONFIG.AVATAR_URL}
                alt="Tal Malek Portrait"
                className="w-full h-full object-cover object-top md:absolute md:inset-0"
              />

              {/* Subtle Editorial Vignette & Bottom Caption */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/25 pointer-events-none" />
              <div className="hidden md:block absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-amber-500/30 to-transparent pointer-events-none" />

              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white pointer-events-none">
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-[0.22em] text-amber-400/90">
                    Portfolio
                  </span>
                  <span className="block text-sm font-serif tracking-wide text-white/95">
                    Tal Malek Photography
                  </span>
                </div>
                <span className="text-[10px] font-mono text-white/60 tracking-widest uppercase">
                  EST. FLICKR
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
