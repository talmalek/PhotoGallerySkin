import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera } from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';
import { FLICKR_CONFIG, DEFAULT_ALBUMS } from '../services/flickrService';

export default function AboutModal() {
  const { isAboutModalOpen, setIsAboutModalOpen, allPhotosCount } = useFlickr();

  const totalWorksCount = allPhotosCount || 635;
  const flickrSeriesCount = DEFAULT_ALBUMS.length - 1; // Exactly 7 Flickr series

  useEffect(() => {
    if (!isAboutModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsAboutModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAboutModalOpen, setIsAboutModalOpen]);

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
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-3xl sm:max-w-[760px] rounded-3xl border-2 border-amber-500/80 dark:border-[#FF7A18]/85 shadow-2xl relative overflow-hidden my-auto z-10 bg-white dark:bg-[#0d0d10] text-neutral-900 dark:text-neutral-100 grid grid-cols-1 md:grid-cols-12"
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
            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-center order-2 md:order-1">
              <div>
                {/* Eyebrow */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-[1.5px] bg-amber-600 dark:bg-amber-400" />
                  <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-amber-700 dark:text-amber-400 font-semibold">
                    Photographer &amp; Visual Artist
                  </span>
                </div>

                {/* Display Name & Handle */}
                <div className="mb-5">
                  <h2 className="text-3xl sm:text-4xl font-serif font-semibold tracking-tight text-neutral-950 dark:text-white leading-[1.08]">
                    Tal Malek
                  </h2>
                  <p className="mt-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
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
                <blockquote className="border-l-2 border-amber-500/70 pl-3.5 py-0.5 mb-4">
                  <p className="text-sm sm:text-base font-serif-italic text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    &ldquo;Capturing authentic frames where light, geometry, and visual harmony converge.&rdquo;
                  </p>
                </blockquote>

                {/* Concise Bio */}
                <div className="space-y-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-light">
                  <p>
                    Welcome to my official photography portfolio. My work explores urban architecture, natural landscapes, botanical and wildlife studies, and fine art visual compositions.
                  </p>
                  <p>
                    Every frame streams directly from high-resolution Flickr collections for an uncompressed, authentic viewing experience.
                  </p>
                </div>

                {/* Metrics Strip (Flickr Collections Archive) */}
                <div className="mt-5 pt-4 border-t border-neutral-200/80 dark:border-neutral-800/90">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Flickr Collection Totals
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                      Flickr Only
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 py-3 px-3.5 rounded-2xl bg-neutral-100/70 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800/80">
                    <div>
                      <span className="block text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white font-mono">
                        {totalWorksCount}+
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                        Flickr Works
                      </span>
                    </div>
                    <div className="border-x border-neutral-200/80 dark:border-neutral-800/90 px-3">
                      <span className="block text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white font-mono">
                        {flickrSeriesCount}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                        Flickr Series
                      </span>
                    </div>
                    <div className="pl-1">
                      <span className="block text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white font-mono">
                        100%
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                        Authentic EXIF
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Full-Bleed Editorial Portrait */}
            <div className="md:col-span-5 relative bg-[#060608] min-h-[260px] sm:min-h-[300px] md:min-h-full order-1 md:order-2 overflow-hidden">
              <img
                src={FLICKR_CONFIG.AVATAR_URL}
                alt="Tal Malek Portrait"
                className="w-full h-full object-cover object-top md:absolute md:inset-0"
              />

              {/* Subtle Editorial Vignette & Bottom Caption */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/25 pointer-events-none" />

              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white pointer-events-none">
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-[0.22em] text-amber-400/90">
                    Portfolio
                  </span>
                  <span className="block text-xs sm:text-sm font-serif tracking-wide text-white/95">
                    Tal Malek Photography
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-mono text-white/60 tracking-widest uppercase">
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
