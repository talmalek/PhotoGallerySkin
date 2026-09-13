import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Camera, Layers, MapPin, Sparkles } from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';
import { FLICKR_CONFIG, DEFAULT_ALBUMS } from '../services/flickrService';

export default function AboutModal() {
  const { isAboutModalOpen, setIsAboutModalOpen, photos } = useFlickr();

  const totalPhotosCount = photos.length > 0 ? photos.length : 635;

  return (
    <AnimatePresence>
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-lg overflow-y-auto">
          {/* Overlay Backdrop Click */}
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setIsAboutModalOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 25 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl rounded-3xl glass-panel p-6 sm:p-10 border border-gray-200 dark:border-neutral-800 shadow-2xl relative overflow-hidden my-auto z-10 bg-white/95 dark:bg-neutral-950/95 text-neutral-900 dark:text-neutral-100"
          >
            {/* Top Close Button */}
            <button
              onClick={() => setIsAboutModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-2xl bg-neutral-100 dark:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Close About Page"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-gray-200 dark:border-neutral-800">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-xl bg-neutral-200">
                  <img
                    src={FLICKR_CONFIG.AVATAR_URL}
                    alt="Tal Malek"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-mono font-bold shadow-md border-2 border-white dark:border-neutral-950 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  ACTIVE
                </span>
              </div>

              <div className="flex flex-col text-center sm:text-left">
                <div className="inline-flex items-center justify-center sm:justify-start gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-mono uppercase tracking-widest mb-2 w-fit mx-auto sm:mx-0">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>PHOTOGRAPHER &amp; CREATOR</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  Tal Malek
                </h2>
                <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-1 flex items-center justify-center sm:justify-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Flickr Profile: @{FLICKR_CONFIG.USERNAME}</span>
                </p>
              </div>
            </div>

            {/* Bio & Philosophy Section */}
            <div className="py-6 space-y-4">
              <h3 className="text-lg font-serif font-medium text-amber-800 dark:text-amber-300 italic">
                "Capturing authentic frames where light, geometry, and visual harmony converge."
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                Welcome to my official photography portfolio. My work explores urban architecture, natural landscapes, plant and animal life, and fine art visual compositions.
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                This digital gallery stream is dynamically integrated directly with Flickr's high-resolution global CDN, delivering an uncompressed, authentic viewing experience.
              </p>
            </div>

            {/* Portfolio Highlights / Stats */}
            <div className="grid grid-cols-3 gap-3 py-4 border-y border-gray-200 dark:border-neutral-800 my-2 text-center">
              <div className="p-3 rounded-2xl bg-neutral-100/80 dark:bg-neutral-900/60 border border-gray-200/60 dark:border-neutral-800">
                <span className="block text-xl font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                  {totalPhotosCount}+
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono uppercase tracking-wider">
                  Photos
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-100/80 dark:bg-neutral-900/60 border border-gray-200/60 dark:border-neutral-800">
                <span className="block text-xl font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                  {DEFAULT_ALBUMS.length - 1}
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono uppercase tracking-wider">
                  Collections
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-100/80 dark:bg-neutral-900/60 border border-gray-200/60 dark:border-neutral-800">
                <span className="block text-xl font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                  100%
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono uppercase tracking-wider">
                  Authentic
                </span>
              </div>
            </div>

            {/* Featured Collections Badges */}
            <div className="pt-4 pb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mb-3">
                Featured Themes
              </span>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_ALBUMS.slice(1).map(album => (
                  <span
                    key={album.id}
                    className="px-3 py-1 rounded-xl text-xs font-mono bg-gray-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-800"
                  >
                    {album.title} ({album.count})
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center gap-3">
              <a
                href={FLICKR_CONFIG.PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex-1 py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <span>Visit Flickr Profile</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={() => setIsAboutModalOpen(false)}
                className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-gray-100 dark:bg-neutral-900 hover:bg-gray-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-sm transition-colors border border-gray-200 dark:border-neutral-800 cursor-pointer"
              >
                Back to Gallery
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
