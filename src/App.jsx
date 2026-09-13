import React from 'react';
import { FlickrProvider, useFlickr } from './context/FlickrContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import GalleryGrid from './components/GalleryGrid';
import LightboxModal from './components/LightboxModal';
import FlickrAuthModal from './components/FlickrAuthModal';
import AboutModal from './components/AboutModal';
import Footer from './components/Footer';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PhotoGallerySkin ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Portfolio View Restored</h2>
          <p className="text-sm text-neutral-400 max-w-md mb-6 font-mono">
            {this.state.error?.message || 'An unexpected rendering update occurred.'}
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="px-6 py-3 rounded-xl bg-amber-500 text-neutral-950 font-bold text-sm hover:bg-amber-400 transition-colors shadow-lg cursor-pointer"
          >
            Reset Settings &amp; Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainContent() {
  const { darkMode } = useFlickr();

  return (
    <div className={`min-h-screen transition-colors duration-500 selection:bg-amber-500/20 selection:text-amber-900 ${
      darkMode ? 'bg-[#09090b] text-neutral-100' : 'bg-white text-neutral-900'
    }`}>
      <Navbar />
      <main className={`transition-colors duration-500 ${darkMode ? 'bg-[#09090b]' : 'bg-white'}`}>
        <Hero />
        <GalleryGrid />
      </main>
      <LightboxModal />
      <AboutModal />
      <FlickrAuthModal />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FlickrProvider>
        <MainContent />
      </FlickrProvider>
    </ErrorBoundary>
  );
}
