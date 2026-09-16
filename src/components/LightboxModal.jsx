import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Camera,
  Calendar,
  Tag,
  Info,
  Sliders,
  Aperture,
  Zap,
  Disc,
  Clock,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  Play,
  Video
} from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';
import { fetchPhotoExif } from '../services/flickrService';

export default function LightboxModal() {
  const { activePhoto, setActivePhoto, navigateLightbox, photos, apiKey } = useFlickr();
  const [isZoomed, setIsZoomed] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [exifData, setExifData] = useState(null);
  const [exifLoading, setExifLoading] = useState(false);

  // Load EXIF data whenever activePhoto changes
  useEffect(() => {
    if (!activePhoto) return;
    setImageLoaded(false);
    setIsZoomed(false);

    let isMounted = true;
    setExifLoading(true);

    fetchPhotoExif(activePhoto.id, apiKey).then((data) => {
      if (isMounted) {
        setExifData(data);
        setExifLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activePhoto, apiKey]);

  // Keyboard Navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (!activePhoto) return;
      if (e.key === 'Escape') {
        if (isZoomed) {
          setIsZoomed(false);
        } else {
          setActivePhoto(null);
        }
      }
      if (e.key === 'ArrowRight') {
        navigateLightbox('next');
        setIsZoomed(false);
      }
      if (e.key === 'ArrowLeft') {
        navigateLightbox('prev');
        setIsZoomed(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhoto, isZoomed, navigateLightbox, setActivePhoto]);

  if (!activePhoto) return null;

  const currentIndex = photos.findIndex(p => p.id === activePhoto.id);
  const totalPhotos = photos.length;

  const toggleZoom = (e) => {
    e.stopPropagation();
    setIsZoomed(!isZoomed);
  };

  return (
    <AnimatePresence>
      {/* Blurred Background Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          if (isZoomed) {
            setIsZoomed(false);
          } else {
            setActivePhoto(null);
          }
        }}
        className={`fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-8 overflow-auto transition-all ${
          isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
        }`}
      >
        {/* Top Control Header */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-6 left-6 right-6 z-50 flex items-center justify-between pointer-events-auto"
        >
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full bg-white/90 text-neutral-900 text-xs font-mono font-bold shadow-lg border border-white/40 flex items-center gap-1.5">
              <span>{currentIndex >= 0 ? `${currentIndex + 1} / ${totalPhotos}` : 'Media'}</span>
              {activePhoto.isVideo && (
                <span className="ml-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Play className="w-2.5 h-2.5 fill-white text-white" />
                  <span>{activePhoto.duration || 'VIDEO'}</span>
                </span>
              )}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-md hidden sm:block">
              {activePhoto.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Magnifier Zoom Button (Images Only) */}
            {!activePhoto.isVideo && (
              <button
                onClick={toggleZoom}
                title={isZoomed ? 'Zoom Out to Original Fit Size' : 'Zoom In to Full Browser Screen'}
                className="p-2.5 rounded-2xl bg-white/90 hover:bg-white text-neutral-900 border border-white/40 shadow-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold"
              >
                {isZoomed ? (
                  <>
                    <ZoomOut className="w-4 h-4 text-amber-600 stroke-[2.5]" />
                    <span className="hidden sm:inline">Fit Screen (-)</span>
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-4 h-4 text-amber-600 stroke-[2.5]" />
                    <span className="hidden sm:inline">Full Screen (+)</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => setShowMetadata(!showMetadata)}
              title="Toggle Detailed EXIF Camera Data"
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer shadow-lg flex items-center gap-1.5 text-xs font-mono font-bold ${
                showMetadata ? 'bg-amber-500 text-neutral-950 border-amber-400' : 'bg-white/90 text-neutral-800 border-white/40 hover:bg-white'
              }`}
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">EXIF Info</span>
            </button>

            <a
              href={activePhoto.link}
              target="_blank"
              rel="noopener noreferrer"
              title="Open on Flickr"
              className="p-2.5 rounded-2xl bg-white/90 text-neutral-800 hover:text-amber-800 border border-white/40 shadow-lg transition-all"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={() => setActivePhoto(null)}
              className="p-2.5 rounded-2xl bg-white text-neutral-900 hover:bg-neutral-100 shadow-xl border border-white/60 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Image Container */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-full max-h-full flex items-center justify-center pointer-events-auto"
        >
          {currentIndex > 0 && !isZoomed && (
            <button
              onClick={() => {
                navigateLightbox('prev');
                setIsZoomed(false);
              }}
              className="absolute -left-16 sm:-left-20 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/90 hover:bg-white text-neutral-900 border border-white/60 shadow-xl transition-all cursor-pointer backdrop-blur-md"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {currentIndex < totalPhotos - 1 && !isZoomed && (
            <button
              onClick={() => {
                navigateLightbox('next');
                setIsZoomed(false);
              }}
              className="absolute -right-16 sm:-right-20 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/90 hover:bg-white text-neutral-900 border border-white/60 shadow-xl transition-all cursor-pointer backdrop-blur-md"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {activePhoto.isVideo ? (
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/20 flex items-center justify-center max-h-[85vh] max-w-[85vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black min-h-[300px] min-w-[300px] z-10 pointer-events-none">
                  <div className="w-12 h-12 rounded-full border-3 border-emerald-400 border-t-transparent animate-spin" />
                </div>
              )}

              <video
                key={activePhoto.videoUrl}
                src={activePhoto.videoUrl}
                poster={activePhoto.largeUrl || activePhoto.mediumUrl || activePhoto.thumbUrl}
                controls
                autoPlay
                loop
                playsInline
                referrerPolicy="no-referrer"
                onLoadedData={() => setImageLoaded(true)}
                onError={(e) => {
                  if (activePhoto.videoFallbackUrl && e.target.src !== activePhoto.videoFallbackUrl) {
                    e.target.src = activePhoto.videoFallbackUrl;
                  }
                }}
                className="max-h-[82vh] max-w-[85vw] rounded-2xl shadow-2xl bg-black object-contain"
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className={`relative rounded-3xl overflow-hidden shadow-2xl bg-neutral-900 border border-white/20 flex items-center justify-center transition-all duration-300 ${
                isZoomed
                  ? 'w-screen h-screen max-w-none max-h-none rounded-none border-none p-0 cursor-zoom-out'
                  : 'max-h-[85vh] max-w-[85vw] cursor-zoom-in'
              }`}
              onClick={toggleZoom}
            >
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 min-h-[300px] min-w-[300px]">
                  <div className="w-12 h-12 rounded-full border-3 border-amber-400 border-t-transparent animate-spin" />
                </div>
              )}

              <img
                src={isZoomed ? (activePhoto.fullUrl || activePhoto.largeUrl) : (activePhoto.largeUrl || activePhoto.mediumUrl)}
                alt={activePhoto.title}
                referrerPolicy="no-referrer"
                onLoad={() => setImageLoaded(true)}
                className={`object-contain transition-all duration-300 ${
                  isZoomed
                    ? 'w-full h-full max-w-none max-h-none rounded-none'
                    : 'max-h-[82vh] max-w-[85vw] rounded-2xl shadow-2xl'
                }`}
              />
            </motion.div>
          )}
        </div>

        {/* Detailed EXIF Metadata Sidebar Drawer */}
        <AnimatePresence>
          {showMetadata && (
            <motion.div
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed right-6 top-20 bottom-6 w-80 sm:w-96 rounded-3xl bg-white/95 backdrop-blur-2xl p-6 border border-gray-200 shadow-2xl z-50 overflow-y-auto pointer-events-auto flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                  <span className="text-xs font-mono uppercase tracking-widest text-amber-700 font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    {activePhoto.isVideo ? 'Video Media Specs' : 'EXIF Camera Specs'}
                  </span>
                  <button
                    onClick={() => setShowMetadata(false)}
                    className="text-neutral-400 hover:text-neutral-900 text-xs font-mono"
                  >
                    Hide
                  </button>
                </div>

                <h3 className="text-xl font-bold text-neutral-900 mb-2 leading-tight">
                  {activePhoto.title}
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-light mb-6">
                  {activePhoto.description || 'Captured moment by Tal Malek.'}
                </p>

                {/* Video Media Specs Section */}
                {activePhoto.isVideo && (
                  <div className="space-y-3 mb-6">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[10px] font-mono uppercase text-emerald-700 dark:text-emerald-400 font-bold block mb-1">
                        Playback Stream
                      </span>
                      <div className="flex items-center gap-2 text-sm font-bold text-emerald-900 dark:text-emerald-200">
                        <Video className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>720p HD MP4 (H.264)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-200">
                        <span className="text-neutral-500 block text-[10px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" /> DURATION
                        </span>
                        <span className="text-neutral-900 font-bold mt-1 block">
                          {activePhoto.duration || '0:06'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-200">
                        <span className="text-neutral-500 block text-[10px] flex items-center gap-1">
                          <Play className="w-3 h-3 text-emerald-600" /> MODE
                        </span>
                        <span className="text-neutral-900 font-bold mt-1 block">
                          Autoplay Loop
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detailed EXIF Grid */}
                {!activePhoto.isVideo && exifData && (
                  <div className="space-y-4">
                    {/* Camera Body */}
                    <div className="p-3.5 rounded-2xl bg-neutral-100 border border-neutral-200">
                      <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                        Camera Body
                      </span>
                      <div className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                        <Camera className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{exifData.camera}</span>
                      </div>
                    </div>

                    {/* Lens Spec */}
                    <div className="p-3.5 rounded-2xl bg-neutral-100 border border-neutral-200">
                      <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                        Lens &amp; Optics
                      </span>
                      <div className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                        <Disc className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{exifData.lens}</span>
                      </div>
                    </div>

                    {/* Technical Exposure Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-200">
                        <span className="text-neutral-500 block text-[10px] flex items-center gap-1">
                          <Layers className="w-3 h-3 text-amber-600" /> FOCAL DISTANCE
                        </span>
                        <span className="text-neutral-900 font-bold mt-1 block">
                          {exifData.focalLength}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-200">
                        <span className="text-neutral-500 block text-[10px] flex items-center gap-1">
                          <Aperture className="w-3 h-3 text-amber-600" /> APERTURE
                        </span>
                        <span className="text-neutral-900 font-bold mt-1 block">
                          {exifData.aperture}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-200">
                        <span className="text-neutral-500 block text-[10px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" /> SHUTTER SPEED
                        </span>
                        <span className="text-neutral-900 font-bold mt-1 block">
                          {exifData.shutterSpeed}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-200">
                        <span className="text-neutral-500 block text-[10px] flex items-center gap-1">
                          <Sliders className="w-3 h-3 text-amber-600" /> ISO
                        </span>
                        <span className="text-neutral-900 font-bold mt-1 block">
                          {exifData.iso}
                        </span>
                      </div>
                    </div>

                    {/* Additional Technical Attributes */}
                    <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-200 text-xs font-mono space-y-1.5 text-neutral-700">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">EXPOSURE MODE:</span>
                        <span className="font-semibold">{exifData.exposureProgram}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">FLASH:</span>
                        <span className="font-semibold">{exifData.flash}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">DATE TAKEN:</span>
                        <span className="font-semibold">{activePhoto.dateTaken}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {activePhoto.tags.length > 0 && (
                      <div>
                        <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-2">
                          Tags &amp; Keywords
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {activePhoto.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 text-xs border border-neutral-200 font-mono"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-6 border-t border-gray-200">
                <a
                  href={activePhoto.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm transition-colors shadow-lg"
                >
                  <span>View Full EXIF on Flickr</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
