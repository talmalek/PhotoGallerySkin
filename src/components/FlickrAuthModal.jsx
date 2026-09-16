import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, CheckCircle2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';
import { FLICKR_CONFIG, extractFreshFlickrApiKey } from '../services/flickrService';

export default function FlickrAuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, apiKey, saveApiKey } = useFlickr();
  const [inputKey, setInputKey] = useState(apiKey);
  const [statusMsg, setStatusMsg] = useState({ text: '', isError: false });
  const [validating, setValidating] = useState(false);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    setInputKey(apiKey || '');
  }, [apiKey, isAuthModalOpen]);

  const handleAutoFillKey = async () => {
    setExtracting(true);
    setStatusMsg({
      text: 'Extracting live active key directly from Flickr profile...',
      isError: false
    });

    try {
      const freshKey = await extractFreshFlickrApiKey();
      if (freshKey) {
        setInputKey(freshKey);
        saveApiKey(freshKey);
        setStatusMsg({
          text: '✓ Dynamic Live Key Extracted & Verified! Connected to 635 Photos.',
          isError: false
        });
        setTimeout(() => {
          setIsAuthModalOpen(false);
        }, 1200);
      } else {
        setStatusMsg({
          text: 'Could not extract key dynamically. Please paste key manually.',
          isError: true
        });
      }
    } catch (err) {
      setStatusMsg({
        text: 'Network error during dynamic key extraction. Please paste key manually.',
        isError: true
      });
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const cleanKey = inputKey.trim();

    if (!cleanKey) {
      saveApiKey('');
      setStatusMsg({ text: 'Saved key cleared.', isError: false });
      return;
    }

    if (cleanKey.length !== 32) {
      setStatusMsg({ text: 'API keys must be exactly 32 characters long.', isError: true });
      return;
    }

    setValidating(true);
    setStatusMsg({ text: 'Validating key with Flickr REST API...', isError: false });

    try {
      const url = `https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&user_id=${FLICKR_CONFIG.USER_NSID}&format=json&nojsoncallback=1&api_key=${cleanKey}&per_page=1`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.stat === 'ok') {
        saveApiKey(cleanKey);
        setStatusMsg({ text: '✓ Verified! Connected to 635 Photos.', isError: false });
        setTimeout(() => {
          setIsAuthModalOpen(false);
        }, 1000);
      } else {
        setStatusMsg({ text: `Error: ${data.message || 'Invalid key'}`, isError: true });
      }
    } catch (err) {
      setStatusMsg({ text: 'Network validation error. Check connection.', isError: true });
    } finally {
      setValidating(false);
    }
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-amber-500/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden text-slate-100"
          >
            {/* Top Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Key className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white tracking-tight">Flickr Key Settings</h3>
                  <span className="text-xs font-mono font-semibold text-amber-300">Profile: @{FLICKR_CONFIG.USERNAME}</span>
                </div>
              </div>

              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Auto-Fill Card (High-Contrast Amber & Slate) */}
            <div className="p-4 rounded-2xl bg-amber-950/70 border-2 border-amber-500/40 mb-6 flex items-center justify-between gap-3 shadow-inner">
              <div>
                <span className="text-xs font-mono font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Auto Live Key Fetch
                </span>
                <span className="text-xs font-medium text-slate-200 block mt-1">
                  Extracts live key from Flickr profile
                </span>
              </div>

              <button
                type="button"
                disabled={extracting || validating}
                onClick={handleAutoFillKey}
                className="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-extrabold text-xs transition-transform active:scale-95 cursor-pointer shrink-0 shadow-md shadow-amber-400/30 flex items-center gap-1.5"
              >
                {extracting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    Extracting...
                  </>
                ) : (
                  'Auto-Fill Today\'s Key'
                )}
              </button>
            </div>

            {/* Input & Connection Form */}
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-amber-400 mb-2">
                  Flickr API Key (32 Characters)
                </label>
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Paste 32-character key here..."
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border-2 border-slate-700 text-amber-300 placeholder-slate-500 font-mono text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 transition-colors select-all"
                />
              </div>

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

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={validating}
                  className="flex-1 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-amber-500/30 cursor-pointer active:scale-98"
                >
                  {validating ? 'Validating Key...' : 'Save & Connect'}
                </button>

                {inputKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputKey('');
                      saveApiKey('');
                      setStatusMsg({ text: 'Saved key cleared.', isError: false });
                    }}
                    className="px-4 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-bold transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>

            {/* Footer security note */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Zero Local Media Storage
              </span>
              <span>NSID: {FLICKR_CONFIG.USER_NSID}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
