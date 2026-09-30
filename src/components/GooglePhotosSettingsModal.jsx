import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Images,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Lock,
  Unlock,
  KeyRound,
  Globe,
  Github,
  RefreshCw
} from 'lucide-react';
import { useFlickr } from '../context/FlickrContext';
import { fetchGoogleSharedAlbum } from '../services/googlePhotosService';

const ADMIN_PIN = '4032';

export default function GooglePhotosSettingsModal() {
  const {
    isGoogleModalOpen,
    setIsGoogleModalOpen,
    googleAlbums,
    setGoogleAlbums,
    setActiveAlbum
  } = useFlickr();

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem('google_admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [inputUrl, setInputUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [ghSyncing, setGhSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', isError: false });
  const [copied, setCopied] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [ghToken, setGhToken] = useState(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('gh_sync_token') || '' : '';
  });

  const saveGhToken = (token) => {
    setGhToken(token);
    if (typeof localStorage !== 'undefined') {
      if (token) localStorage.setItem('gh_sync_token', token);
      else localStorage.removeItem('gh_sync_token');
    }
  };

  const handlePinSubmit = (e) => {
    if (e) e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAuthenticated(true);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('google_admin_auth', 'true');
      }
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleLock = () => {
    setIsAuthenticated(false);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('google_admin_auth');
    }
    setPinInput('');
    setPinError(false);
    setStatusMsg({ text: 'Management window locked.', isError: false });
  };

  // Trigger GitHub Actions workflow dispatch to paginate and deploy on GitHub Pages
  const triggerGitHubActionSync = async (action, targetUrl) => {
    if (!ghToken) {
      setShowTokenInput(true);
      setStatusMsg({
        text: 'Please provide a GitHub Personal Access Token (PAT) to trigger the automated cloud pagination.',
        isError: true
      });
      return false;
    }

    setGhSyncing(true);
    setStatusMsg({
      text: `🚀 Dispatching GitHub Action to paginate all photos and deploy to GitHub Pages...`,
      isError: false
    });

    try {
      const res = await fetch('https://api.github.com/repos/talmalek/PhotoGallerySkin/actions/workflows/sync-google-album.yml/dispatches', {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${ghToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            action: action, // 'add' or 'remove'
            target: targetUrl
          }
        })
      });

      if (res.status === 204 || res.ok) {
        setStatusMsg({
          text: `✓ GitHub Action triggered successfully! GitHub is now extracting all images and updating the site (~30s).`,
          isError: false
        });
        return true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        setStatusMsg({
          text: `GitHub API error (${res.status}): ${errJson.message || 'Check PAT token permissions (requires workflow / repo write)'}`,
          isError: true
        });
        return false;
      }
    } catch (err) {
      setStatusMsg({
        text: `Failed to contact GitHub API: ${err.message}`,
        isError: true
      });
      return false;
    } finally {
      setGhSyncing(false);
    }
  };

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
          coverUrl: albumData.coverUrl || albumData.photos[0].thumbUrl || albumData.photos[0].url_s,
          source: 'google',
          photos: albumData.photos
        };

        const updated = [...googleAlbums.filter(a => a.shareUrl !== cleanUrl), newAlbum];
        setGoogleAlbums(updated);
        setInputUrl('');

        if (newAlbum.count >= 300 && ghToken) {
          setStatusMsg({
            text: `✓ Added "${newAlbum.title}" (${newAlbum.count} photos). Triggering GitHub cloud sync...`,
            isError: false
          });
          triggerGitHubActionSync('add', cleanUrl);
        } else {
          setStatusMsg({
            text: `✓ Added "${newAlbum.title}" (${newAlbum.count} photos)!`,
            isError: false
          });
        }

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
    const targetAlbum = googleAlbums.find(a => a.id === idToRemove);
    const updated = googleAlbums.filter(a => a.id !== idToRemove);
    setGoogleAlbums(updated);
    setStatusMsg({ text: 'Album removed from gallery.', isError: false });

    // Also trigger cloud sync removal if GitHub Token is available
    if (targetAlbum && ghToken) {
      triggerGitHubActionSync('remove', targetAlbum.shareUrl);
    }
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
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-white tracking-tight">Google Photos Albums</h3>
                    {isAuthenticated && (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                        <Globe className="w-3 h-3 text-emerald-400 animate-pulse" /> Cloud Synced
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-300">
                    {isAuthenticated ? 'Admin Manager • Changes sync across all devices' : 'Protected Admin Window'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {isAuthenticated && (
                  <button
                    onClick={handleLock}
                    title="Lock Admin Window"
                    className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono"
                  >
                    <Lock className="w-4 h-4" />
                    <span className="hidden sm:inline">Lock</span>
                  </button>
                )}
                <button
                  onClick={() => setIsGoogleModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!isAuthenticated ? (
              /* PIN Code Gate Screen */
              <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10 mb-4">
                  <Lock className="w-8 h-8 stroke-[2]" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">Passcode Protected</h4>
                <p className="text-xs text-slate-400 max-w-sm mb-6">
                  Adding or removing albums affects what all visitors see across every device. Please enter the admin password to continue.
                </p>

                <form onSubmit={handlePinSubmit} className="w-full max-w-xs space-y-4">
                  <div className="relative">
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={8}
                      autoFocus
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value);
                        if (pinError) setPinError(false);
                      }}
                      placeholder="Enter password..."
                      className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-center font-mono text-lg tracking-widest text-emerald-300 placeholder-slate-600 focus:outline-none focus:ring-2 transition-all ${
                        pinError
                          ? 'border-rose-500 focus:ring-rose-500/40 ring-2 ring-rose-500/20'
                          : 'border-slate-700 focus:border-emerald-400 focus:ring-emerald-400/30'
                      }`}
                    />
                  </div>

                  {pinError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs font-mono text-rose-400 flex items-center justify-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> Incorrect password. Please try again.
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/25 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-4 h-4" /> Unlock Album Manager
                  </button>
                </form>
              </div>
            ) : (
              /* Scrollable Admin Content */
              <div className="overflow-y-auto space-y-6 pr-1 custom-scrollbar">
                {/* Cloud Sync Announcement */}
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-200">
                  <Globe className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Live Central Synchronization:</span> Any album added or removed here is instantly saved to the centralized cloud database. Every visitor on any phone or desktop will see the changes upon reload.
                  </div>
                </div>

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
                  <span className="text-[10px] text-emerald-400/80 block mt-1">
                    💡 Albums with &gt;300 photos: Add locally on dev server to auto-paginate all images, then copy code config.
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

                {/* GitHub Actions Cloud Sync Config */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-200 font-bold font-mono">
                      <Github className="w-4 h-4 text-emerald-400" />
                      <span>GitHub Cloud Automation (Albums &gt; 300 photos)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTokenInput(!showTokenInput)}
                      className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                    >
                      {ghToken ? (showTokenInput ? 'Hide Token' : 'Edit GitHub Token') : 'Set GitHub Token'}
                    </button>
                  </div>

                  {showTokenInput && (
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <label className="text-[11px] text-slate-400 block font-mono">
                        GitHub Personal Access Token (PAT) with <code className="text-emerald-300">workflow</code> / <code className="text-emerald-300">repo</code> write:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={ghToken}
                          onChange={(e) => saveGhToken(e.target.value)}
                          placeholder="ghp_..."
                          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-300 text-xs font-mono focus:outline-none focus:border-emerald-400"
                        />
                        {ghToken && (
                          <button
                            type="button"
                            onClick={() => saveGhToken('')}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 text-xs font-mono cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Saved in your browser only. When adding or removing albums &gt;300 photos on the live site, this triggers GitHub Actions to extract all pages and deploy.
                      </span>
                    </div>
                  )}

                  {ghSyncing && (
                    <div className="flex items-center gap-2 text-emerald-300 font-mono text-xs pt-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching GitHub cloud extractor workflow...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

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
