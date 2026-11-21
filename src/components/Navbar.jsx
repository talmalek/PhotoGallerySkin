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
import { playShutterSound, unlockShutterAudio } from '../utils/shutterSound';

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
  const [shutterCycle, setShutterCycle] = useState(0);
  const [isShutterAnimating, setIsShutterAnimating] = useState(false);
  const menuRef = useRef(null);
  const rafRef = useRef(null);
  const irisGroupRef = useRef(null);
  const bladePathsRef = useRef([]);
  const bladeEdgesRef = useRef([]);

  const APERTURE_BLADES = [0, 45, 90, 135, 180, 225, 270, 315];

  // Exact non-overlapping cyclic 8-blade iris geometry (direct DOM paths, no <use> shadow-tree bugs)
  const updateIrisGeometry = (openRadius, twistDeg) => {
    if (!irisGroupRef.current) return;
    if (openRadius >= 51.5) {
      irisGroupRef.current.setAttribute('opacity', '0');
      return;
    }
    const R = 56;
    const r = Math.min(Math.max(openRadius, 1.4), 51.4);
    const tan225 = Math.tan(Math.PI / 8);
    const c45 = Math.SQRT1_2;
    const s45 = Math.SQRT1_2;

    const v1x = r;
    const v1y = r * tan225;
    const o0x = r;
    const o0y = Math.sqrt(R * R - r * r);
    const o1x = o0x * c45 - o0y * s45;
    const o1y = o0x * s45 + o0y * c45;

    const d = `M ${v1x.toFixed(2)},${v1y.toFixed(2)} L ${o0x.toFixed(2)},${o0y.toFixed(2)} A ${R},${R} 0 0,1 ${o1x.toFixed(2)},${o1y.toFixed(2)} Z`;
    const x1 = v1x.toFixed(2);
    const y1 = v1y.toFixed(2);
    const x2 = o0x.toFixed(2);
    const y2 = o0y.toFixed(2);

    for (let i = 0; i < 8; i++) {
      const pathEl = bladePathsRef.current[i];
      const edgeEl = bladeEdgesRef.current[i];
      if (pathEl) pathEl.setAttribute('d', d);
      if (edgeEl) {
        edgeEl.setAttribute('x1', x1);
        edgeEl.setAttribute('y1', y1);
        edgeEl.setAttribute('x2', x2);
        edgeEl.setAttribute('y2', y2);
      }
    }

    irisGroupRef.current.setAttribute('opacity', '1');
    irisGroupRef.current.setAttribute('transform', `translate(50, 50) rotate(${twistDeg.toFixed(2)})`);
  };

  const triggerShutter = () => {
    if (isShutterAnimating) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    setIsShutterAnimating(true);
    setShutterCycle((c) => c + 1);
    playShutterSound();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const duration = 760;
    const startTime = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const step = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      let radius = 52;
      let twist = 0;

      if (p < 0.38) {
        // Closing phase: 52 -> 1.6
        const t = easeOutCubic(p / 0.38);
        radius = 52 - (52 - 1.6) * t;
        twist = 26 * t;
      } else if (p < 0.52) {
        // Brief shutter hold at closed pinhole
        radius = 1.6;
        twist = 26;
      } else {
        // Opening phase: 1.6 -> 52
        const t = easeInOutCubic((p - 0.52) / 0.48);
        radius = 1.6 + (52 - 1.6) * t;
        twist = 26 * (1 - t);
      }

      updateIrisGeometry(radius, twist);

      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        updateIrisGeometry(52, 0);
        setIsShutterAnimating(false);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    const handleUnlock = () => unlockShutterAudio();
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('pointerdown', handleUnlock, { once: true, passive: true });
    window.addEventListener('keydown', handleUnlock, { once: true, passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 overflow-visible">
      {/* Dedicated frosted backdrop layer so backdrop-filter never clips protruding medallion */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[#FAF9F6]/88 dark:bg-[#08080A]/88 backdrop-blur-xl border-b border-stone-200/80 dark:border-white/[0.08] transition-colors duration-500"
      >
        {/* Subtle molten amber bottom horizon accent in Dark Mode */}
        <div className="hidden dark:block absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[#FF7A18]/50 via-[#FF7A18]/18 to-transparent" />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-12 sm:h-[52px] flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] gap-3">
        {/* Left Zone: Minimal Protruding TM Lens Medallion Only */}
        <button
          type="button"
          onClick={() => setIsAboutModalOpen(true)}
          onMouseEnter={triggerShutter}
          onFocus={triggerShutter}
          className="relative flex items-center group focus:outline-none cursor-pointer shrink-0 justify-self-start"
          title="Tal Malek Photography — About"
          aria-label="Tal Malek Photography — About"
        >
          {/* Protruding Camera Lens Medallion */}
          <div className="relative self-start mt-1.5 sm:mt-2 -mb-5 sm:-mb-7 z-20 shrink-0 transform-gpu">
            {/* Multi-Layer Molten Amber / Solar-Eclipse Rim Glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full dark-lens-corona-pulse"
            >
              {/* Layer 1: Wide atmospheric crimson-orange corona bloom */}
              <div
                className="absolute -inset-[13px] rounded-full blur-[14px] opacity-85 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 dark-lens-corona-spin"
                style={{
                  background:
                    'conic-gradient(from 315deg, rgba(255,34,0,0.18) 0deg, rgba(255,58,0,0.45) 45deg, rgba(255,115,0,0.95) 95deg, rgba(255,205,96,1) 120deg, rgba(255,90,0,0.85) 150deg, rgba(220,28,0,0.35) 215deg, rgba(180,20,0,0.14) 300deg, rgba(255,34,0,0.18) 360deg)'
                }}
              />
              {/* Layer 2: Tight intense molten flare */}
              <div
                className="absolute -inset-[5px] rounded-full blur-[5px] opacity-95 group-hover:opacity-100 transition-opacity duration-300 dark-lens-corona-spin"
                style={{
                  background:
                    'conic-gradient(from 315deg, rgba(255,50,0,0.38) 0deg, rgba(255,95,0,0.75) 65deg, rgba(255,215,130,1) 118deg, rgba(255,105,0,0.9) 155deg, rgba(230,38,0,0.42) 225deg, rgba(255,50,0,0.38) 360deg)'
                }}
              />
              {/* Layer 3: Razor-sharp incandescent filament rim */}
              <div
                className="absolute -inset-[1.5px] rounded-full dark-lens-corona-spin"
                style={{
                  background:
                    'conic-gradient(from 315deg, rgba(255,68,0,0.65) 0deg, rgba(255,120,20,0.9) 70deg, rgba(255,246,214,1) 118deg, rgba(255,130,20,0.92) 152deg, rgba(255,55,0,0.55) 230deg, rgba(255,68,0,0.65) 360deg)'
                }}
              />
            </div>

            {/* Outer Canvas Halo Ring (Light mode crisp cutout / Dark mode obsidian core inside molten rim) */}
            <div className="relative w-[60px] h-[60px] sm:w-[74px] sm:h-[74px] rounded-full p-[3.5px] sm:p-[4px] bg-gradient-to-br from-neutral-700 via-neutral-900 to-neutral-950 dark:from-[#121216] dark:via-[#09090c] dark:to-[#050507] ring-[3px] ring-[#FAF9F6] dark:ring-0 shadow-[0_10px_24px_-6px_rgba(18,18,18,0.32)] dark:shadow-[0_0_22px_rgba(255,82,0,0.45),0_0_44px_rgba(255,38,0,0.22)] group-hover:shadow-[0_12px_30px_-4px_rgba(154,107,56,0.38)] dark:group-hover:shadow-[0_0_28px_rgba(255,120,20,0.7),0_0_56px_rgba(255,48,0,0.38)] transition-shadow duration-500">
              {/* Rotating Focus-Ring Tick Marks */}
              <svg
                viewBox="0 0 100 100"
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 w-full h-full text-stone-400/55 group-hover:text-[#C89D5C] group-hover:rotate-[24deg] transition-all duration-700 ease-out"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="47.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeDasharray="1.8 4.4"
                />
                {/* Red/Brass Lens Alignment Index Dot */}
                <circle cx="50" cy="2.6" r="1.5" fill="#C89D5C" />
              </svg>

              {/* Inner Optical Element & Brand Logo */}
              <div className="relative w-full h-full rounded-full overflow-hidden border border-[#9A6B38]/50 group-hover:border-[#C89D5C] bg-[#FAF9F6] dark:bg-[#121216] transition-colors duration-300 flex items-center justify-center">
                <img
                  src={FLICKR_CONFIG.LOGO_URL}
                  alt="Tal Malek Logo"
                  className={`w-full h-full p-[3px] sm:p-[4px] object-contain dark:invert dark:drop-shadow-[0_0_8px_rgba(255,140,40,0.4)] transition-transform duration-500 ${
                    isShutterAnimating ? 'lens-photo-actuate' : 'group-hover:scale-105'
                  }`}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />

                {/* Subtle Optical Specular Glint */}
                <div
                  key={`glint-${shutterCycle}`}
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 ${
                    isShutterAnimating ? 'lens-glint-actuate' : ''
                  }`}
                />

                {/* 8-Blade Mechanical Iris Aperture Shutter (direct SVG elements for reliable compositing) */}
                <svg
                  viewBox="0 0 100 100"
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 w-full h-full transform-gpu"
                >
                  <defs>
                    <clipPath id="navbar-lens-clip">
                      <circle cx="50" cy="50" r="50" />
                    </clipPath>
                    <linearGradient id="aperture-blade-metal" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2c2c33" />
                      <stop offset="55%" stopColor="#16161b" />
                      <stop offset="100%" stopColor="#0b0b0e" />
                    </linearGradient>
                  </defs>

                  <g clipPath="url(#navbar-lens-clip)">
                    <g ref={irisGroupRef} opacity="0" transform="translate(50, 50)">
                      {APERTURE_BLADES.map((angle, idx) => (
                        <g key={angle} transform={`rotate(${angle})`}>
                          <path
                            ref={(el) => {
                              bladePathsRef.current[idx] = el;
                            }}
                            d=""
                            fill="url(#aperture-blade-metal)"
                            stroke="#09090b"
                            strokeWidth="1.2"
                            strokeLinejoin="round"
                          />
                          <line
                            ref={(el) => {
                              bladeEdgesRef.current[idx] = el;
                            }}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="0"
                            stroke="#C89D5C"
                            strokeOpacity="0.7"
                            strokeWidth="1.15"
                            strokeLinecap="round"
                          />
                        </g>
                      ))}
                    </g>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </button>

        {/* Center Zone: Geometrically Centered Album Capsule */}
        <div className="hidden md:flex items-center justify-self-center">
          <AlbumDropdown />
        </div>

        {/* Right Zone: Slim Unified Optical Control Dock */}
        <div className="flex items-center gap-2 justify-self-end">
          {/* View Mode Capsule (Zipper Masonry / Matrix) */}
          <div className="flex items-center p-0.5 rounded-full bg-stone-100/85 dark:bg-[#101014]/90 border border-stone-200/90 dark:border-white/10 transition-colors duration-300">
            <button
              type="button"
              onClick={() => setViewMode('masonry')}
              title="Zipper Masonry View"
              className={`px-2.5 py-1 rounded-full transition-all duration-300 cursor-pointer flex items-center gap-1.5 text-[11px] font-mono border ${
                viewMode === 'masonry'
                  ? 'bg-white dark:bg-[#19120E] border-stone-200/90 dark:border-[#FF7A18]/65 text-[#9A6B38] dark:text-[#FFB35C] shadow-xs dark:shadow-[0_0_14px_rgba(255,95,15,0.42),inset_0_0_8px_rgba(255,140,40,0.18)] font-semibold'
                  : 'border-transparent text-stone-500 dark:text-neutral-400 hover:text-[#121212] dark:hover:text-[#FFB35C]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Masonry</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Matrix View"
              className={`px-2.5 py-1 rounded-full transition-all duration-300 cursor-pointer flex items-center gap-1.5 text-[11px] font-mono border ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#19120E] border-stone-200/90 dark:border-[#FF7A18]/65 text-[#9A6B38] dark:text-[#FFB35C] shadow-xs dark:shadow-[0_0_14px_rgba(255,95,15,0.42),inset_0_0_8px_rgba(255,140,40,0.18)] font-semibold'
                  : 'border-transparent text-stone-500 dark:text-neutral-400 hover:text-[#121212] dark:hover:text-[#FFB35C]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Matrix</span>
            </button>
          </div>

          {/* Dark / Light Toggle Button */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to Gallery Paper (Light)' : 'Switch to Darkroom (Dark)'}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-stone-100/85 dark:bg-[#101014]/90 border border-stone-200/90 dark:border-white/10 text-stone-600 dark:text-[#FFB35C] hover:bg-white dark:hover:bg-[#19120E] hover:border-[#9A6B38]/45 dark:hover:border-[#FF7A18]/70 dark:hover:shadow-[0_0_16px_rgba(255,95,15,0.48),inset_0_0_8px_rgba(255,140,40,0.18)] transition-all duration-300 cursor-pointer"
          >
            {darkMode ? (
              <Sun className="w-3.5 h-3.5 text-[#FFB35C] drop-shadow-[0_0_6px_rgba(255,140,40,0.7)]" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-stone-600" />
            )}
          </button>

          {/* Compact Settings & Links Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              title="Portfolio & Sources"
              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 cursor-pointer ${
                menuOpen
                  ? 'bg-white dark:bg-[#19120E] border-[#9A6B38]/60 dark:border-[#FF7A18]/75 text-[#9A6B38] dark:text-[#FFB35C] shadow-xs dark:shadow-[0_0_16px_rgba(255,95,15,0.48),inset_0_0_8px_rgba(255,140,40,0.18)]'
                  : 'bg-stone-100/85 dark:bg-[#101014]/90 border-stone-200/90 dark:border-white/10 text-stone-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-[#19120E] hover:border-[#9A6B38]/45 dark:hover:border-[#FF7A18]/70 dark:hover:text-[#FFB35C] dark:hover:shadow-[0_0_16px_rgba(255,95,15,0.45),inset_0_0_8px_rgba(255,140,40,0.16)]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 10, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 mt-1 w-60 rounded-2xl p-2 shadow-2xl border border-stone-200 dark:border-[#FF7A18]/30 bg-[#FAF9F6]/98 dark:bg-[#0D0D11]/95 dark:shadow-[0_24px_56px_-12px_rgba(0,0,0,0.92),0_0_24px_rgba(255,95,15,0.2)] backdrop-blur-2xl z-50 overflow-hidden"
                >
                  {/* Subtle top molten ember hairline (Dark Mode) */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none hidden dark:block absolute top-0 left-5 right-5 h-[1.5px] bg-gradient-to-r from-transparent via-[#FF8C2A]/85 to-transparent"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setIsAboutModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 dark:text-neutral-200 hover:bg-stone-200/60 dark:hover:bg-[#FF7A18]/12 dark:hover:text-[#FFF3E0] transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#9A6B38] dark:text-[#FF8C2A]" />
                    <span>About Tal Malek</span>
                  </button>

                  <a
                    href={FLICKR_CONFIG.PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-stone-700 dark:text-neutral-200 hover:bg-stone-200/60 dark:hover:bg-[#FF7A18]/12 dark:hover:text-[#FFF3E0] transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400 dark:text-neutral-400" />
                      <span>Flickr Profile</span>
                    </span>
                    <span className="text-[10px] font-mono text-stone-400 dark:text-[#FFB35C]/75">@{FLICKR_CONFIG.USERNAME}</span>
                  </a>

                  <div className="my-1.5 border-t border-stone-200/70 dark:border-white/[0.07]" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsGoogleModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-neutral-300 hover:bg-stone-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-neutral-300 hover:bg-stone-200/60 dark:hover:bg-[#FF7A18]/12 dark:hover:text-[#FFF3E0] transition-colors cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5 text-stone-400 dark:text-[#FF8C2A]/80" />
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
