import React, { useEffect, useRef, useState, useMemo, memo } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useInView } from 'framer-motion';
import { Eye, ExternalLink, Calendar, Maximize2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
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
 * Ambient Starfield Particle Canvas (Matrix View Background ONLY)
 * Lightweight, 120 FPS canvas particle background
 */
function StarfieldCanvas({ cursorX, cursorY }) {
  const { darkMode } = useFlickr();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200);
      canvas.height = canvas.offsetHeight || (typeof window !== 'undefined' ? window.innerHeight : 800);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const count = darkMode ? 110 : 65;
    const stars = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * (darkMode ? 2.2 : 1.5) + 0.6,
      opacity: Math.random() * (darkMode ? 0.6 : 0.3) + (darkMode ? 0.2 : 0.1),
      speed: Math.random() * 0.0003 + 0.0001,
      layer: Math.floor(Math.random() * 3) + 1,
      isGold: Math.random() > 0.4
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = cursorX ? cursorX.get() : -9999;
      const cy = cursorY ? cursorY.get() : -9999;
      const mx = cx !== -9999 ? (cx / (canvas.width || 1200) - 0.5) * 18 : 0;
      const my = cy !== -9999 ? (cy / (canvas.height || 800) - 0.5) * 18 : 0;

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
            : `rgba(255, 255, 255, ${star.opacity * 1.2})`;
        } else {
          ctx.fillStyle = `rgba(217, 119, 6, ${star.opacity * 0.7})`;
        }
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
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
 * Left Column (colIdx 0): arrives from LEFT (-125px -> 0px)
 * Middle Column (colIdx 1): STAYS in middle (0px)
 * Right Column (colIdx 2): arrives from RIGHT (+125px -> 0px)
 * Scrubbed 1-to-1: Scrolling DOWN aligns to position, Scrolling UP returns to original position
 */
const ZipperCard = memo(function ZipperCard({ photo, globalIdx, colIdx, setActivePhoto }) {
  const cardRef = useRef(null);
  const [realAspectRatio, setRealAspectRatio] = useState(photo.aspectRatio || '4/3');

  useEffect(() => {
    if (photo.aspectRatio) {
      setRealAspectRatio(photo.aspectRatio);
    }
  }, [photo.aspectRatio]);

  const handleImageLoad = (e) => {
    const nw = e.target.naturalWidth;
    const nh = e.target.naturalHeight;
    if (nw > 0 && nh > 0) {
      setRealAspectRatio(`${nw}/${nh}`);
    }
  };

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'center center']
  });

  // Column-based entrance direction logic
  const initialX = colIdx === 0 ? -125 : colIdx === 2 ? 125 : 0;
  const initialY = colIdx === 1 ? 55 : 35; // Middle column glides up vertically

  // Continuous 2-way scrubbed transforms
  const x = useTransform(scrollYProgress, [0, 1], [initialX, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [initialY, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [0, 1]);

  return (
    <motion.div
      ref={cardRef}
      style={{ x, y, opacity }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3 }}
      onClick={() => setActivePhoto(photo)}
      className="group relative rounded-3xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 shadow-sm hover:shadow-2xl border border-neutral-200/80 dark:border-neutral-800 cursor-pointer"
    >
      <div
        className="w-full relative overflow-hidden flex items-center justify-center bg-neutral-200/40 dark:bg-neutral-800/40"
        style={{ aspectRatio: realAspectRatio }}
      >
        <img
          src={photo.mediumUrl || photo.thumbUrl}
          alt={photo.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={handleImageLoad}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          onError={(e) => {
            e.target.src = photo.thumbUrl;
          }}
        />

        <div className="absolute inset-0 bg-neutral-950/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px] p-6 flex flex-col justify-between z-10 text-left">
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
    </motion.div>
  );
});

function getAspectRatioHeight(aspectRatioStr) {
  if (!aspectRatioStr) return 0.75;
  const parts = aspectRatioStr.split('/');
  if (parts.length === 2) {
    const w = parseFloat(parts[0]);
    const h = parseFloat(parts[1]);
    if (w > 0 && h > 0) return h / w;
  }
  return 0.75;
}

/**
 * MatrixCard Component (Matrix View - Native Engine Offscreen Pruning, Progressive Loading & Starfield Repulsion)
 * Uses content-visibility: auto for instant browser offscreen pruning, preserving zero GPU memory bloat.
 * Loads fast, aspect-ratio-preserving 320px (_n) image instantly, upgrading to 640px (_z) HD on hover.
 */
const MatrixCard = memo(function MatrixCard({ photo, globalIdx, cursorX, cursorY, setActivePhoto }) {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { margin: '200px 0px 200px 0px' });
  const [isHovered, setIsHovered] = useState(false);
  const [realAspectRatio, setRealAspectRatio] = useState(photo.aspectRatio || '4/3');

  useEffect(() => {
    if (photo.aspectRatio) {
      setRealAspectRatio(photo.aspectRatio);
    }
  }, [photo.aspectRatio]);

  const handleImageLoad = (e) => {
    const nw = e.target.naturalWidth;
    const nh = e.target.naturalHeight;
    if (nw > 0 && nh > 0) {
      setRealAspectRatio(`${nw}/${nh}`);
    }
  };

  // Progressive image resolution sources
  const lowResSrc = photo.small320Url || photo.smallUrl || photo.thumbUrl;
  const highResSrc = photo.thumbUrl || photo.mediumUrl;
  const currentSrc = isHovered ? highResSrc : lowResSrc;

  // Viewport-gated mouse displacement math: skips calculations if offscreen
  const rawShiftX = useTransform(cursorX, (cx) => {
    if (!isInView || cx === -9999 || !cardRef.current) return 0;
    const rect = cardRef.current.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const dx = cardCenterX - cx;
    const cy = cursorY.get();
    const dy = (rect.top + rect.height / 2) - cy;
    const dist = Math.hypot(dx, dy);
    const radius = 210;

    if (dist < radius && dist > 0) {
      const factor = Math.pow(1 - dist / radius, 2);
      return (dx / dist) * factor * 22;
    }
    return 0;
  });

  const rawShiftY = useTransform(cursorY, (cy) => {
    if (!isInView || cy === -9999 || !cardRef.current) return 0;
    const rect = cardRef.current.getBoundingClientRect();
    const cardCenterY = rect.top + rect.height / 2;
    const cx = cursorX.get();
    const dx = (rect.left + rect.width / 2) - cx;
    const dy = cardCenterY - cy;
    const dist = Math.hypot(dx, dy);
    const radius = 210;

    if (dist < radius && dist > 0) {
      const factor = Math.pow(1 - dist / radius, 2);
      return (dy / dist) * factor * 22;
    }
    return 0;
  });

  // Soft, floating starfield spring physics
  const shiftX = useSpring(rawShiftX, { stiffness: 180, damping: 24 });
  const shiftY = useSpring(rawShiftY, { stiffness: 180, damping: 24 });

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min((globalIdx % 12) * 0.03, 0.36) }}
      style={{
        x: shiftX,
        y: shiftY,
        contentVisibility: 'auto',
        containIntrinsicSize: '1px 240px'
      }}
      whileHover={{ scale: 1.05, zIndex: 30 }}
      onMouseEnter={() => setIsHovered(true)}
      onClick={() => setActivePhoto(photo)}
      className="group relative rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 shadow-sm hover:shadow-2xl border border-neutral-200/80 dark:border-neutral-800 cursor-pointer z-10 will-change-transform"
    >
      <div
        className="w-full relative overflow-hidden flex items-center justify-center bg-neutral-200/40 dark:bg-neutral-800/40"
        style={{ aspectRatio: realAspectRatio }}
      >
        <img
          src={currentSrc}
          alt={photo.title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={handleImageLoad}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            e.target.src = photo.thumbUrl;
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
  const speeds = [
    [0, -12],
    [0, 12],
    [0, -8],
    [0, 8],
    [0, -10],
    [0, 10]
  ];
  const range = speeds[colIdx % speeds.length];
  const y = useTransform(scrollYProgress, [0, 1], range);

  return (
    <motion.div style={{ y }} className="flex flex-col gap-4 sm:gap-5">
      {children}
    </motion.div>
  );
}

/**
 * Responsive Page Pagination Controls Component (50 / 100 / 200 photos per page)
 */
function PaginationBar({ currentPage, totalPages, pageSize, setPageSize, setCurrentPage, sectionRef, totalPhotos }) {
  if (totalPhotos === 0 || totalPages <= 1) return null;

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    if (sectionRef && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(totalPhotos, currentPage * pageSize);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-12 mb-6 flex flex-col sm:flex-row items-center justify-between gap-6 py-5 px-6 rounded-3xl bg-neutral-100/90 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800 backdrop-blur-md relative z-20 shadow-lg">
      {/* Page Size Selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Per Page:</span>
        <div className="flex items-center gap-1.5 bg-neutral-200/60 dark:bg-neutral-800/60 p-1 rounded-xl">
          {[50, 100, 200].map((size) => (
            <button
              key={size}
              onClick={() => {
                setPageSize(size);
                if (sectionRef && sectionRef.current) {
                  sectionRef.current.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                pageSize === size
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Page Info */}
      <div className="text-xs font-mono font-semibold text-neutral-600 dark:text-neutral-400">
        Showing <span className="text-amber-600 dark:text-amber-400 font-bold">{startIdx}–{endIdx}</span> of <span className="font-bold">{totalPhotos}</span> Photos
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1 text-xs font-mono font-bold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition-all ${
                currentPage === p
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white/50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1 text-xs font-mono font-bold"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Column Parallax Container for Masonry View (Exact mfrports.com 3-column Zipper Parallax)
 */
function ZipperColumnContainer({ colIdx, children, scrollYProgress }) {
  const parallaxRanges = [
    [0, -120], // Column 0 slides UP
    [0, 120],  // Column 1 slides DOWN (Zipper Opposite!)
    [0, -90]   // Column 2 slides UP
  ];
  const range = parallaxRanges[colIdx % parallaxRanges.length];
  const y = useTransform(scrollYProgress, [0, 1], range);

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
    setActivePhoto,
    viewMode,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage
  } = useFlickr();

  const sectionRef = useRef(null);
  const windowWidth = useWindowWidth();

  // Scroll Progress relative to Gallery Section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start']
  });

  // Motion values for Matrix View Starfield mouse displacement
  const cursorX = useMotionValue(-9999);
  const cursorY = useMotionValue(-9999);

  const handleMouseMove = (e) => {
    if (viewMode === 'grid') {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    }
  };

  const handleMouseLeave = () => {
    if (viewMode === 'grid') {
      cursorX.set(-9999);
      cursorY.set(-9999);
    }
  };

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

  // Page pagination slicing
  const activePageSize = pageSize || 200;
  const totalPages = Math.ceil(photos.length / activePageSize);
  const paginatedPhotos = useMemo(() => {
    const start = (currentPage - 1) * activePageSize;
    return photos.slice(start, start + activePageSize);
  }, [photos, currentPage, activePageSize]);

  // Shortest-Column Height Balancing: preserves native image aspect ratios while filling all columns evenly without gaps
  const matrixColumns = useMemo(() => {
    const cols = Array.from({ length: matrixCols }, () => ({
      items: [],
      height: 0
    }));
    if (viewMode !== 'grid') return cols.map(c => c.items);

    paginatedPhotos.forEach((photo, idx) => {
      const globalIdx = (currentPage - 1) * activePageSize + idx;
      const h = getAspectRatioHeight(photo.aspectRatio);

      let minColIdx = 0;
      let minHeight = cols[0].height;
      for (let c = 1; c < matrixCols; c++) {
        if (cols[c].height < minHeight) {
          minHeight = cols[c].height;
          minColIdx = c;
        }
      }

      cols[minColIdx].items.push({ photo, globalIdx });
      cols[minColIdx].height += h + 0.08;
    });

    return cols.map(c => c.items);
  }, [paginatedPhotos, matrixCols, currentPage, activePageSize, viewMode]);

  const masonryColumns = useMemo(() => {
    const cols = Array.from({ length: masonryCols }, () => ({
      items: [],
      height: 0
    }));
    if (viewMode === 'grid') return cols.map(c => c.items);

    paginatedPhotos.forEach((photo, idx) => {
      const globalIdx = (currentPage - 1) * activePageSize + idx;
      const h = getAspectRatioHeight(photo.aspectRatio);

      let minColIdx = 0;
      let minHeight = cols[0].height;
      for (let c = 1; c < masonryCols; c++) {
        if (cols[c].height < minHeight) {
          minHeight = cols[c].height;
          minColIdx = c;
        }
      }

      cols[minColIdx].items.push({ photo, globalIdx, colIdx: minColIdx });
      cols[minColIdx].height += h + 0.08;
    });

    return cols.map(c => c.items);
  }, [paginatedPhotos, masonryCols, currentPage, activePageSize, viewMode]);

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

  // Render Matrix View
  if (viewMode === 'grid') {
    return (
      <section
        ref={sectionRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="max-w-[1600px] mx-auto px-4 sm:px-8 py-8 relative min-h-screen"
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

        {/* Pagination Controls */}
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={activePageSize}
          setPageSize={setPageSize}
          setCurrentPage={setCurrentPage}
          sectionRef={sectionRef}
          totalPhotos={photos.length}
        />
      </section>
    );
  }

  // Render Masonry View
  return (
    <section ref={sectionRef} className="max-w-[1600px] mx-auto px-4 sm:px-8 py-8 min-h-screen">
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
            {colItems.map(({ photo, globalIdx, colIdx: itemColIdx }) => (
              <ZipperCard
                key={`zipper-${photo.id}-${globalIdx}`}
                photo={photo}
                globalIdx={globalIdx}
                colIdx={itemColIdx}
                setActivePhoto={setActivePhoto}
              />
            ))}
          </ZipperColumnContainer>
        ))}
      </div>

      {/* Pagination Controls */}
      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={activePageSize}
        setPageSize={setPageSize}
        setCurrentPage={setCurrentPage}
        sectionRef={sectionRef}
        totalPhotos={photos.length}
      />
    </section>
  );
}
