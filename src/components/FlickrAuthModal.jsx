import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, CheckCircle2, Copy, Check, ShieldCheck, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';
import { FLICKR_CONFIG } from '../services/flickrService';

const EXTRACTOR_SCRIPT = `javascript:(function(){var k=window.YUI_config?.flickr?.api?.site_key||(document.body.innerHTML.match(/site_key":"([a-f0-9]{32})/)||[,""])[1];if(k){prompt("Copy your active Flickr REST key:",k)}else{alert("Please open flickr.com/photos/talmalek first then click this!")}})();`;

export default function FlickrAuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, apiKey, saveApiKey } = useFlickr();
  const [inputKey, setInputKey] = useState(apiKey);
  const [statusMsg, setStatusMsg] = useState({ text: '', isError: false });
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    setInputKey(apiKey || '');
  }, [apiKey, isAuthModalOpen]);

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(EXTRACTOR_SCRIPT);
    setCopiedBookmarklet(true);
    setStatusMsg({ text: 'Extractor bookmarklet script copied! Paste it in your browser address bar while on Flickr.', isError: false });
    setTimeout(() => setCopiedBookmarklet(false), 2500);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const cleanKey = inputKey.trim();

    if (!cleanKey) {
      saveApiKey('');
      setStatusMsg({ text: 'Key cleared.', isError: false });
      return;
    }

    if (cleanKey.length !== 32) {
      setStatusMsg({ text: 'Flickr API keys must be exactly 32 characters long.', isError: true });
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
        setStatusMsg({ text: '✓ Key Verified! Connected to 635 Photos.', isError: false });
        setTimeout(() => {
          setIsAuthModalOpen(false);
        }, 1200);
      } else {
        setStatusMsg({ text: `Key Error: ${data.message || 'Invalid or expired key'}`, isError: true });
      }
    } catch (err) {
      setStatusMsg({ text: 'Validation network request failed. Check key & connection.', isError: true });
    } finally {
      setValidating(false);
    }
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg rounded-3xl glass-panel p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden text-neutral-100"
          >
            {/* Top Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-100">Flickr Key Settings</h3>
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

            {/* Step-by-Step 1-Click Key Extractor Box */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 1-Click Key Extractor Tool
                </span>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  Daily Rotation Safe
                </span>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed font-light">
                Flickr rotates guest keys daily. Extract the fresh key directly from Flickr in 2 quick steps:
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={FLICKR_CONFIG.PROFILE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono flex items-center justify-center gap-1.5 text-neutral-200 transition-colors"
                >
                  <span>1. Open Flickr Page</span>
                  <ExternalLink className="w-3 h-3 text-amber-400" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyBookmarklet}
                  className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-mono flex items-center justify-center gap-1.5 text-amber-300 transition-colors cursor-pointer"
                >
                  {copiedBookmarklet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBookmarklet ? 'Script Copied!' : '2. Copy Extractor'}</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-neutral-400 bg-neutral-950/80 p-2 rounded-lg border border-neutral-800/80">
                <span className="text-neutral-300 font-semibold">Tip:</span> On Flickr page, open browser Console (`F12`) &amp; type <code className="text-amber-300">window.YUI_config.flickr.api.site_key</code> to copy key.
              </div>
            </div>

            {/* Input & Connection Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-2">
                  Paste 32-Character API Key
                </label>
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Paste active key here (e.g. e776850bbaefc08cd183...)"
                  className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-700/80 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-mono transition-colors"
                />
              </div>

              {statusMsg.text && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-xs font-mono p-2.5 rounded-lg flex items-center gap-2 ${
                    statusMsg.isError
                      ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                      : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {statusMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span>{statusMsg.text}</span>
                </motion.div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={validating}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-sm transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
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
