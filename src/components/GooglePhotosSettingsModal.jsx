import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Images, Plus, Trash2, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';
import { fetchGoogleSharedAlbum } from '../services/googlePhotosService';

export default function GooglePhotosSettingsModal() {
  const {
    isGoogleModalOpen,
    setIsGoogleModalOpen,
    googleAlbums,
    setGoogleAlbums,
    setActiveAlbum
  } = useFlickr();

  const [inputUrl, setInputUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', isError: false });
  const [copied, setCopied] = useState(false);

  const handleAddAlbum = async (e) => {
    e.preventDefault();
    const cleanUrl = inputUrl.trim();

    if (!cleanUrl) {
      setStatusMsg({ text: 'Please enter a Google Photos shared album URL.', isError: true });
      return;
    }

    if (!cleanUrl.includes('photos.app.goo.gl') && !cleanUrl.includes('photos.google.com')) {
      setStatusMsg({ text: 'URL must be a valid Google Photos shared album link.', isError: true });
      return;
    }

    setFetching(true);
    setStatusMsg({ text: 'Fetching and verifying album from Google Photos...', isError: false });

    try {
      const albumData = await fetchGoogleSharedAlbum(cleanUrl);
      if (albumData && albumData.photos && albumData.photos.length > 0) {
        const newAlbum = {
          id: `google_${Date.now()}`,
          title: albumData.title || 'Google Photos Album',
          shareUrl: cleanUrl,
          count: albumData.count || albumData.photos.length,
          coverUrl: albumData.coverUrl || albumData.photos[0].url_s,
          source: 'google'
        };

        const updated = [...googleAlbums.filter(a => a.shareUrl !== cleanUrl), newAlbum];
        setGoogleAlbums(updated);
        setInputUrl('');
        setStatusMsg({
          text: `✓ Added "${newAlbum.title}" (${newAlbum.count} photos)!`,
          isError: false
        });

        // Automatically switch to the newly added album
        setActiveAlbum(newAlbum.id);
      } else {
        setStatusMsg({
          text: 'Could not find photos at this link. Make sure the album sharing link is enabled.',
          isError: true
        });
      }
    } catch (err) {
      setStatusMsg({
        text: 'Failed to fetch album. Please verify connection and URL.',
        isError: true
      });
    } finally {
      setFetching(false);
    }
  };

  const handleRemoveAlbum = (idToRemove) => {
    const updated = googleAlbums.filter(a => a.id !== idToRemove);
    setGoogleAlbums(updated);
    setStatusMsg({ text: 'Album removed from gallery.', isError: false });
  };

  const handleCopyConfig = () => {
    const code = `export const DEFAULT_GOOGLE_ALBUMS = ${JSON.stringify(googleAlbums, null, 2)};\n`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className="w-full max-w-xl rounded-3xl bg-slate-900 border-2 border-emerald-500/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden text-slate-100 max-h-[90vh] flex flex-col"
          >
            {/* Top Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Images className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white tracking-tight">Google Photos Albums</h3>
                  <span className="text-xs font-mono font-semibold text-emerald-300">Share albums with visitors</span>
                </div>
              </div>

              <button
                onClick={() => setIsGoogleModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto space-y-6 pr-1 custom-scrollbar">
              {/* Add New Album Card */}
              <form onSubmit={handleAddAlbum} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Shared Album Link
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://photos.app.goo.gl/..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={fetching}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {fetching ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Fetch &amp; Add
                      </>
                    )}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 block mt-2">
                  Open any album in Google Photos &rarr; click <strong>Share</strong> &rarr; <strong>Create link</strong>.
                </span>
              </form>

              {/* Status Message */}
              {statusMsg.text && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-xs font-mono font-bold p-3 rounded-xl flex items-center gap-2 border-2 ${
                    statusMsg.isError
                      ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                      : 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                  }`}
                >
                  {statusMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
                  <span>{statusMsg.text}</span>
                </motion.div>
              )}

              {/* Connected Albums List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Active Google Albums ({googleAlbums.length})
                  </span>
                  {googleAlbums.length > 0 && (
                    <button
                      type="button"
                      onClick={handleCopyConfig}
                      className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copy config to make permanent in src/config/googleAlbums.js"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied Config!' : 'Copy Code Config'}
                    </button>
                  )}
                </div>

                {googleAlbums.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs font-mono">
                    No Google Photos albums added yet. Paste a link above to add one.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {googleAlbums.map((album) => (
                      <div
                        key={album.id}
                        className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                            {album.coverUrl ? (
                              <img src={album.coverUrl} alt={album.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600">
                                <Images className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">{album.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {album.count || '?'} Photos
                              </span>
                              <a
                                href={album.shareUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-0.5 truncate"
                              >
                                View on Google <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveAlbum(album.id)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                          title="Remove Album"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Direct Google CDN Stream
              </span>
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Close &amp; View Gallery
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
