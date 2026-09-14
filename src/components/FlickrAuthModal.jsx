import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, CheckCircle2, Copy, Check, ShieldCheck, RefreshCw } from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';
import { FLICKR_CONFIG, getWorkingFlickrApiKey } from '../services/flickrService';

export default function FlickrAuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, apiKey, saveApiKey } = useFlickr();
  const [inputKey, setInputKey] = useState(apiKey);
  const [activeExtractedKey, setActiveExtractedKey] = useState('');
  const [loadingKey, setLoadingKey] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isAuthModalOpen) {
      setLoadingKey(true);
      getWorkingFlickrApiKey(apiKey)
        .then((k) => {
          if (k) setActiveExtractedKey(k);
        })
        .finally(() => setLoadingKey(false));
    }
  }, [isAuthModalOpen, apiKey]);

  const handleCopyKey = () => {
    if (!activeExtractedKey) return;
    navigator.clipboard.writeText(activeExtractedKey);
    setCopied(true);
    setStatusMsg('Active key copied to clipboard! You can paste it into the field below.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyKey = () => {
    if (!activeExtractedKey) return;
    setInputKey(activeExtractedKey);
    saveApiKey(activeExtractedKey);
    setStatusMsg('Active Flickr REST key applied & connected!');
    setTimeout(() => {
      setStatusMsg('');
      setIsAuthModalOpen(false);
    }, 1200);
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveApiKey(inputKey.trim());
    setStatusMsg('Flickr key updated successfully!');
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

            {/* Active Key Display Card */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">
                  Dynamically Extracted Live Key
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  {loadingKey ? 'Extracting...' : activeExtractedKey ? '635 Photos Active' : 'No Key Detected'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800 font-mono text-xs text-amber-300 select-all">
                <span className="truncate flex-1">
                  {loadingKey ? (
                    <span className="flex items-center gap-2 text-neutral-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Detecting active live key...
                    </span>
                  ) : activeExtractedKey ? (
                    activeExtractedKey
                  ) : (
                    <span className="text-neutral-500">Paste your API key in the box below</span>
                  )}
                </span>
                {activeExtractedKey && (
                  <>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] flex items-center gap-1 transition-colors cursor-pointer border border-amber-500/30"
                      title="Copy Key to Clipboard"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyKey}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-neutral-950 font-bold text-[11px] hover:bg-amber-400 transition-colors cursor-pointer"
                      title="Use and apply this key"
                    >
                      Use Key
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-2">
                  Paste API Key Below
                </label>
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Paste key here..."
                  className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-700/80 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-mono transition-colors"
                />
                <p className="text-[11px] text-neutral-500 mt-2 font-light">
                  Paste the active key above into this box to stream all 635 photos.
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
                  Save &amp; Connect
                </button>

                {inputKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputKey('');
                      saveApiKey('');
                      setStatusMsg('Reset to public fallback key.');
                    }}
                    className="px-4 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-mono border border-neutral-800 transition-colors cursor-pointer"
                  >
                    Clear Key
                  </button>
                )}
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
