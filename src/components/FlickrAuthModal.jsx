import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';
import { FLICKR_CONFIG } from '../services/flickrService';

export default function FlickrAuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, apiKey, saveApiKey } = useFlickr();
  const [inputKey, setInputKey] = useState(apiKey);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    saveApiKey(inputKey.trim());
    setStatusMsg('Flickr credentials updated successfully!');
    setTimeout(() => {
      setStatusMsg('');
      setIsAuthModalOpen(false);
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg rounded-3xl glass-panel p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden"
          >
            {/* Top Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-100">Flickr Connection Settings</h3>
                  <span className="text-xs font-mono text-neutral-400">Target Profile: @{FLICKR_CONFIG.USERNAME}</span>
                </div>
              </div>

              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Connection Status Card */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider block">
                  Public Stream Connected
                </span>
                <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
                  Live stream is actively pulling photos directly from Flickr CDN (<code className="bg-emerald-950/60 px-1 py-0.5 rounded font-mono">live.staticflickr.com</code>).
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-2">
                  Flickr API Key (Optional for REST Endpoints)
                </label>
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Paste your Flickr API Key here..."
                  className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-700/80 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-mono transition-colors"
                />
                <p className="text-[11px] text-neutral-500 mt-2 font-light">
                  If omitted, PhotoGallerySkin operates using zero-config public feeds automatically.
                </p>
              </div>

              {statusMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-mono text-amber-400 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
                >
                  {statusMsg}
                </motion.div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Save &amp; Sync
                </button>

                <a
                  href="https://www.flickr.com/services/api/keys/apply/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-mono border border-neutral-800 flex items-center gap-1.5 transition-colors"
                >
                  <span>Get Key</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </form>

            {/* Footer security note */}
            <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Zero Local Image Hosting
              </span>
              <span>NSID: {FLICKR_CONFIG.USER_NSID}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
