import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, Calendar } from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';

export default function FilmstripView() {
  const { photos, setActivePhoto } = useFlickr();
  const containerRef = useRef(null);

  const scroll = (direction) => {
    if (!containerRef.current) return;
    const scrollAmount = direction === 'left' ? -400 : 400;
    containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-6 relative">
      {/* Header controls */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
          Awwwards Horizontal Reel
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2.5 rounded-xl glass-panel hover:bg-gray-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-amber-700 border border-gray-200 dark:border-neutral-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => scroll('right')}
            className="p-2.5 rounded-xl glass-panel hover:bg-gray-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-amber-700 border border-gray-200 dark:border-neutral-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory py-4 custom-scrollbar scroll-smooth"
      >
        {photos.map((photo, index) => (
          <motion.div
            key={`filmstrip-${photo.id}-${index}`}
            whileHover={{ y: -6 }}
            onClick={() => setActivePhoto(photo)}
            className="snap-center shrink-0 w-[300px] sm:w-[420px] rounded-3xl overflow-hidden bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-xl cursor-pointer group relative"
          >
            <div className="h-[380px] w-full relative overflow-hidden bg-neutral-100 dark:bg-neutral-950">
              <img
                src={photo.mediumUrl || photo.thumbUrl}
                alt={photo.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-xs font-mono border border-white/20">
                    Frame #{index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-amber-200 transition-colors line-clamp-1">
                    {photo.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-4 text-xs font-mono text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {photo.dateTaken}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
