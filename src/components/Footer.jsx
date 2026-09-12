import React from 'react';
import { Camera, ArrowUp, ExternalLink } from 'lucide-react';
import { FLICKR_CONFIG } from '../services/flickrService';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-20 border-t border-gray-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/60 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left */}
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">PhotoGallerySkin</h4>
            <p className="text-xs text-neutral-500 font-mono">
              Flickr Portfolio Skin for @{FLICKR_CONFIG.USERNAME}
            </p>
          </div>
        </div>

        {/* Center */}
        <div className="flex items-center gap-6 text-xs font-mono text-neutral-500 dark:text-neutral-400">
          <a
            href={FLICKR_CONFIG.PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <span>Flickr Stream</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span>•</span>
          <span className="flex items-center gap-1">
            Inspired by <a href="https://mfrports.com/portfolio/" target="_blank" rel="noreferrer" className="underline hover:text-neutral-900 dark:hover:text-white">mfrports</a>
          </span>
        </div>

        {/* Right - Back to Top */}
        <button
          onClick={scrollToTop}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass-panel hover:bg-gray-100 dark:hover:bg-neutral-800 text-xs font-mono text-neutral-700 dark:text-neutral-300 hover:text-amber-700 border border-gray-200 dark:border-neutral-800 transition-all cursor-pointer"
        >
          <span>Back to top</span>
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
}
