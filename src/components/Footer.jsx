import React from 'react';
import { ArrowUp, ExternalLink } from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';
import { FLICKR_CONFIG } from '../services/flickrService';

export default function Footer() {
  const { setIsAboutModalOpen } = useFlickr();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-20 border-t border-stone-200/80 dark:border-neutral-800/80 bg-[#FAF9F6]/90 dark:bg-[#08080A]/90 transition-colors duration-500">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Left: Monogram */}
        <button
          type="button"
          onClick={() => setIsAboutModalOpen(true)}
          className="flex items-center gap-3 text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-300 dark:border-neutral-700 group-hover:border-[#9A6B38] dark:group-hover:border-[#C89D5C] transition-colors bg-[#FAF9F6] dark:bg-[#121216] p-0.5 flex items-center justify-center shrink-0">
            <img
              src={FLICKR_CONFIG.LOGO_URL}
              alt="Tal Malek Logo"
              className="w-full h-full object-contain dark:invert"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-[0.18em] uppercase text-[#121212] dark:text-[#F2F0EC] group-hover:text-[#9A6B38] dark:group-hover:text-[#C89D5C] transition-colors">
              Tal Malek Photography
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-neutral-500 font-mono">
              @{FLICKR_CONFIG.USERNAME} · Official Archive
            </p>
          </div>
        </button>

        {/* Center Links */}
        <div className="flex items-center gap-5 text-xs font-mono text-stone-500 dark:text-neutral-400">
          <button
            type="button"
            onClick={() => setIsAboutModalOpen(true)}
            className="hover:text-[#9A6B38] dark:hover:text-[#C89D5C] transition-colors cursor-pointer"
          >
            Portfolio
          </button>
          <span className="text-stone-300 dark:text-neutral-700">·</span>
          <a
            href={FLICKR_CONFIG.PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#9A6B38] dark:hover:text-[#C89D5C] flex items-center gap-1 transition-colors"
          >
            <span>Flickr</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Right: Back to Top */}
        <button
          type="button"
          onClick={scrollToTop}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-stone-200/90 dark:border-neutral-800 bg-stone-100/70 dark:bg-neutral-900/70 hover:border-[#9A6B38]/50 dark:hover:border-[#C89D5C]/50 text-xs font-mono text-stone-600 dark:text-neutral-300 hover:text-[#9A6B38] dark:hover:text-[#C89D5C] transition-colors cursor-pointer"
        >
          <span>Top</span>
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
}
