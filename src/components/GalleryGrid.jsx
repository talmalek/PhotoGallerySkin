import React, { useEffect, useRef, useState, useMemo, memo } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Eye, ExternalLink, Calendar, Maximize2, Loader2 } from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';

/**
 * Responsive Window Width Hook (Throttled)
 */
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    let timeoutId = null;
    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setWidth(window.innerWidth), 100);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  return width;
}

/**
 * Ambient Starfield Particle Canvas (Matrix Background)
 * Adapts dynamically to Night/Dark mode toggle with glowing starlight
 */
function StarfieldCanvas({ cursorX, cursorY }) {
  const { darkMode } = useFlickr();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const count = darkMode ? 130 : 80;
    const stars = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * (darkMode ? 2.4 : 1.6) + 0.6,
      opacity: Math.random() * (darkMode ? 0.65 : 0.35) + (darkMode ? 0.2 : 0.1),
      speed: Math.random() * 0.0003 + 0.0001,
      layer: Math.floor(Math.random() * 3) + 1,
      isGold: Math.random() > 0.4
    }));

    const render = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = cursorX.get();
      const cy = cursorY.get();
      const mx = cx !== -9999 ? (cx / (window.innerWidth || 1200) - 0.5) * 24 : 0;
      const my = cy !== -9999 ? (cy / (window.innerHeight || 800) - 0.5) * 24 : 0;

      stars.forEach((star) => {
        star.y -= star.speed;
        if (star.y < 0) star.y = 1;

        const px = (star.x * canvas.width) + (mx * star.layer);
        const py = (star.y * canvas.height) + (my * star.layer);

        ctx.beginPath();
        ctx.arc(px, py, star.size, 0, Math.PI * 2);

        if (darkMode) {
          ctx.fillStyle = star.isGold
            ? `rgba(251, 191, 36, ${star.opacity})`
            : `rgba(255, 255, 255, ${star.opacity * 1.3})`;
        } else {
          ctx.fillStyle = `rgba(217, 119, 6, ${star.opacity * 0.7})`;
        }
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [cursorX, cursorY, darkMode]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-700 ${
        darkMode ? 'opacity-80' : 'opacity-35'
      }`}
    />
  );
}

/**
 * ZipperCard Component (Masonry View)
 * Clean editorial photo card, memoized for 60fps rendering
 */
const ZipperCard = memo(function ZipperCard({ photo, globalIdx, setActivePhoto }) {
  const [exactAspectRatio, setExactAspectRatio] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      setExactAspectRatio(`${naturalWidth} / ${naturalHeight}`);
    }
    setLoaded(true);
  };

  return (
    <div
      onClick={() => setActivePhoto(photo)}
      className="group relative rounded-3xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 shadow-sm hover:shadow-2xl border border-neutral-200/80 dark:border-neutral-800 cursor-pointer"
    >
      <div
        className="w-full relative overflow-hidden flex items-center justify-center bg-neutral-200/40 dark:bg-neutral-800/40"
        style={{ aspectRatio: exactAspectRatio || '4/3' }}
      >
        <img
          src={photo.mediumUrl || photo.thumbUrl}
          alt={photo.title}
          loading="lazy"
          onLoad={handleImageLoad}
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={(e) => {
            e.target.src = photo.thumbUrl;
            setLoaded(true);
          }}
        />

        <div className="absolute inset-0 bg-neutral-950/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px] p-6 flex flex-col justify-between z-10">
          <div className="flex justify-between items-center">
            <span className="px-3 py-1 rounded-full bg-white/90 text-neutral-900 text-xs font-mono font-bold shadow-md truncate max-w-[200px]">
              {photo.title}
            </span>
            <div className="w-10 h-10 rounded-full bg-white text-neutral-950 flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <Maximize2 className="w-4 h-4 text-neutral-900" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white leading-snug line-clamp-2">
              {photo.title}
            </h3>
            <div className="mt-2 flex items-center justify-between text-xs font-mono text-neutral-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                {photo.dateTaken}
              </span>
              <a
                href={photo.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-white hover:text-amber-300 p-1 flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg backdrop-blur-md transition-colors"
                title="View on Flickr"
              >
                <span>Flickr</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * MatrixCard Component (Individual Starfield Mouse Displacement)
 * Measures exact center of THIS individual picture frame and pushes ONLY nearby frames aside by a few pixels
 */
const MatrixCard = memo(function MatrixCard({ photo, globalIdx, cursorX, cursorY, setActivePhoto }) {
  const cardRef = useRef(null);
  const [exactAspectRatio, setExactAspectRatio] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Compute radial displacement ONLY for this specific individual card relative to cursor position
  const rawShiftX = useTransform(cursorX, (cx) => {
    if (!cardRef.current || cx === -9999) return 0;
    const rect = cardRef.current.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;
    const cy = cursorY.get();

    const dx = cardCenterX - cx;
    const dy = cardCenterY - cy;
    const dist = Math.hypot(dx, dy);
    const radius = 240; // Proximity aura in pixels

    if (dist < radius && dist > 0) {
      const force = Math.pow(1 - dist / radius, 2) * 24; // max 24px push
      return (dx / dist) * force;
    }
    return 0;
  });

  const rawShiftY = useTransform(cursorY, (cy) => {
    if (!cardRef.current || cy === -9999) return 0;
    const rect = cardRef.current.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;
    const cx = cursorX.get();

    const dx = cardCenterX - cx;
    const dy = cardCenterY - cy;
    const dist = Math.hypot(dx, dy);
    const radius = 240;

    if (dist < radius && dist > 0) {
      const force = Math.pow(1 - dist / radius, 2) * 24;
      return (dy / dist) * force;
    }
    return 0;
  });

  // Spring physics for responsive, butter-smooth movement & snap-back
  const springShiftX = useSpring(rawShiftX, { stiffness: 220, damping: 22 });
  const springShiftY = useSpring(rawShiftY, { stiffness: 220, damping: 22 });

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      setExactAspectRatio(`${naturalWidth} / ${naturalHeight}`);
    }
    setLoaded(true);
  };

  return (
    <motion.div
      ref={cardRef}
      style={{ x: springShiftX, y: springShiftY }}
      onClick={() => setActivePhoto(photo)}
      className="group relative rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 shadow-sm hover:shadow-2xl border border-neutral-200/80 dark:border-neutral-800 cursor-pointer z-10 will-change-transform"
    >
      <div
        className="w-full relative overflow-hidden flex items-center justify-center bg-neutral-200/40 dark:bg-neutral-800/40"
        style={{ aspectRatio: exactAspectRatio || '4/3' }}
      >
        <img
          src={photo.mediumUrl || photo.thumbUrl}
          alt={photo.title}
          loading="lazy"
          onLoad={handleImageLoad}
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ease-out ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={(e) => {
            e.target.src = photo.thumbUrl;
            setLoaded(true);
          }}
        />

        <div className="absolute inset-0 bg-neutral-950/55 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px] p-3.5 flex flex-col justify-between z-10 text-left">
          <div className="flex justify-between items-center">
            <span className="px-2 py-0.5 rounded-full bg-white/90 text-neutral-900 text-[10px] font-mono font-bold shadow-sm truncate max-w-[130px]">
              {photo.title}
            </span>
            <div className="w-7 h-7 rounded-full bg-white text-neutral-950 flex items-center justify-center shadow-md transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
              <Maximize2 className="w-3.5 h-3.5 text-neutral-900" />
            </div>
          </div>

          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">
              {photo.title}
            </h4>
            <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-neutral-300">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-300" />
                {photo.dateTaken}
              </span>
              <a
                href={photo.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-white hover:text-amber-300 flex items-center gap-0.5 bg-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded backdrop-blur-md transition-colors"
                title="View on Flickr"
              >
                <span>Flickr</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

/**
 * Column Parallax Container for Matrix View
 */
function MatrixColumnContainer({ colIdx, children, scrollYProgress }) {
  const offsets = [
    [-20, 15],
    [25, -20],
    [-15, 18],
    [30, -25],
    [-18, 20],
    [15, -15]
  ];
  const colParallax = offsets[colIdx % offsets.length];

  const rawY = useTransform(scrollYProgress, [0, 1], colParallax);
  const y = useSpring(rawY, { stiffness: 100, damping: 26, mass: 0.4 });

  return (
    <motion.div style={{ y }} className="flex flex-col gap-4 sm:gap-5">
      {children}
    </motion.div>
  );
}

/**
 * Column Parallax Container for Masonry View
 */
function ZipperColumnContainer({ colIdx, children, scrollYProgress }) {
  const offsets = [
    [-35, 25],
    [45, -35],
    [-25, 30]
  ];
  const colParallax = offsets[colIdx % offsets.length];

  const rawY = useTransform(scrollYProgress, [0, 1], colParallax);
  const y = useSpring(rawY, { stiffness: 100, damping: 26, mass: 0.4 });

  return (
    <motion.div style={{ y }} className="flex flex-col gap-8 lg:gap-10">
      {children}
    </motion.div>
  );
}

export default function GalleryGrid() {
  const {
    photos,
    loading,
    loadingMore,
    loadNextPage,
    hasMore,
    setActivePhoto,
    viewMode
  } = useFlickr();

  const sectionRef = useRef(null);
  const sentinelRef = useRef(null);
  const windowWidth = useWindowWidth();

  // Cursor coordinates in viewport pixels
  const cursorX = useMotionValue(-9999);
  const cursorY = useMotionValue(-9999);

  const handleMouseMove = (e) => {
    cursorX.set(e.clientX);
    cursorY.set(e.clientY);
  };

  const handleMouseLeave = () => {
    cursorX.set(-9999);
    cursorY.set(-9999);
  };

  // Single section scroll listener for 100% fluid performance
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start']
  });

  // Responsive column counts
  const matrixCols = useMemo(() => {
    if (windowWidth >= 1536) return 6;
    if (windowWidth >= 1280) return 5;
    if (windowWidth >= 1024) return 4;
    if (windowWidth >= 640) return 3;
    return 2;
  }, [windowWidth]);

  const masonryCols = useMemo(() => {
    if (windowWidth >= 1024) return 3;
    if (windowWidth >= 640) return 2;
    return 1;
  }, [windowWidth]);

  // Memoized column photo distributions
  const matrixColumns = useMemo(() => {
    const cols = Array.from({ length: matrixCols }, () => []);
    photos.forEach((photo, globalIdx) => {
      cols[globalIdx % matrixCols].push({ photo, globalIdx });
    });
    return cols;
  }, [photos, matrixCols]);

  const masonryColumns = useMemo(() => {
    const cols = Array.from({ length: masonryCols }, () => []);
    photos.forEach((photo, globalIdx) => {
      cols[globalIdx % masonryCols].push({ photo, globalIdx });
    });
    return cols;
  }, [photos, masonryCols]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadNextPage();
        }
      },
      { rootMargin: '600px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadNextPage]);

  if (loading && photos.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="h-96 rounded-3xl skeleton-shimmer border border-neutral-200" />
        ))}
      </div>
    );
  }

  if (!loading && photos.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-24 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4 text-amber-700 border border-neutral-200">
          <Eye className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900">No Photos Found</h3>
        <p className="text-sm text-neutral-500 mt-2">Try selecting another Flickr album from the dropdown.</p>
      </div>
    );
  }

  // Render Matrix View (Individual Starfield Frame Displacement)
  if (viewMode === 'grid') {
    return (
      <section
        ref={sectionRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="max-w-[1600px] mx-auto px-4 sm:px-8 py-8 overflow-hidden relative"
      >
        <StarfieldCanvas cursorX={cursorX} cursorY={cursorY} />

        <div
          className="grid gap-4 sm:gap-5 items-start relative z-10"
          style={{
            gridTemplateColumns: `repeat(${matrixCols}, minmax(0, 1fr))`
          }}
        >
          {matrixColumns.map((colItems, colIdx) => (
            <MatrixColumnContainer
              key={`matrix-col-${colIdx}-${matrixCols}`}
              colIdx={colIdx}
              scrollYProgress={scrollYProgress}
            >
              {colItems.map(({ photo, globalIdx }) => (
                <MatrixCard
                  key={`matrix-${photo.id}-${globalIdx}`}
                  photo={photo}
                  globalIdx={globalIdx}
                  cursorX={cursorX}
                  cursorY={cursorY}
                  setActivePhoto={setActivePhoto}
                />
              ))}
            </MatrixColumnContainer>
          ))}
        </div>

        {/* Sentinel */}
        <div ref={sentinelRef} className="py-20 flex items-center justify-center min-h-[120px] relative z-10">
          {loadingMore && (
            <div className="flex items-center gap-3 text-amber-800 font-mono text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-amber-700" />
              <span>Fetching next photostream batch...</span>
            </div>
          )}
          {!hasMore && photos.length > 0 && (
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
              — End of Flickr Collection ({photos.length} photos loaded) —
            </span>
          )}
        </div>
      </section>
    );
  }

  // Render Masonry View (Gapless Column-based 3-Column Zipper Parallax)
  return (
    <section ref={sectionRef} className="max-w-[1600px] mx-auto px-4 sm:px-8 py-8 overflow-hidden">
      <div
        className="grid gap-8 lg:gap-10 items-start"
        style={{
          gridTemplateColumns: `repeat(${masonryCols}, minmax(0, 1fr))`
        }}
      >
        {masonryColumns.map((colItems, colIdx) => (
          <ZipperColumnContainer
            key={`masonry-col-${colIdx}-${masonryCols}`}
            colIdx={colIdx}
            scrollYProgress={scrollYProgress}
          >
            {colItems.map(({ photo, globalIdx }) => (
              <ZipperCard
                key={`zipper-${photo.id}-${globalIdx}`}
                photo={photo}
                globalIdx={globalIdx}
                setActivePhoto={setActivePhoto}
              />
            ))}
          </ZipperColumnContainer>
        ))}
      </div>

      {/* Sentinel for Infinite Lazy Scroll */}
      <div ref={sentinelRef} className="py-20 flex items-center justify-center min-h-[120px]">
        {loadingMore && (
          <div className="flex items-center gap-3 text-amber-800 font-mono text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-amber-700" />
            <span>Fetching next photostream batch from Flickr...</span>
          </div>
        )}
        {!hasMore && photos.length > 0 && (
          <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
            — End of Flickr Collection ({photos.length} photos loaded) —
          </span>
        )}
      </div>
    </section>
  );
}
