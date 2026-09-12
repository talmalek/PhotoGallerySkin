# PhotoGallerySkin 📸✨

> A luxury, high-performance web application inspired by `mfrports.com/portfolio/`, designed to stream high-resolution photography live from Flickr profiles with zero local media storage.

![License](https://img.shields.io/badge/License-MIT-amber.svg)
![React](https://img.shields.io/badge/React-19.0.0-blue.svg)
![Vite](https://img.shields.io/badge/Vite-6.4.3-purple.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4.svg)

---

## 🌟 Overview

**PhotoGallerySkin** transforms Flickr photostreams and album collections into an authentic, high-fashion photography portfolio. Built specifically for **Tal Malek** (`@talmalek` / NSID `126120136@N05`), it features dynamic aspect ratio packing, real-time scroll parallax motion, and interactive mouse-displacement starfield physics.

---

## 🔥 Key Features

- **🌐 Zero Local Storage**: All images, thumbnails, and metadata stream directly live from Flickr's global CDN (`live.staticflickr.com`).
- **☀️/🌙 Clean Editorial White & Full-Page Night Mode**: Complete theme toggle with smooth transitions (`#ffffff` / `#09090b`).
- **📱 Dual View Modes**:
  - **Zipper Masonry View**: 3-column vertical column-packed masonry that preserves exact uncropped photo aspect ratios (`naturalWidth / naturalHeight`) and eliminates vertical black gaps.
  - **Matrix View**: 5-column grid featuring ambient starlight canvas particles and interactive starfield mouse frame displacement.
- **✨ Starfield Mouse Physics**: Hovering over picture frames nudges nearby cards outward via a 240px radial proximity aura driven by Framer Motion spring physics (`stiffness: 220, damping: 22`).
- **🏷️ Authentic Flickr Metadata**: Preserves real photo titles and original camera filenames (`DSC04892`, `IMG_2023...`).
- **🎬 Cinema Lightbox & EXIF Drawer**:
  - Full-screen high-res lightbox with keyboard arrow navigation.
  - Interactive slide-out EXIF specs drawer displaying Camera Body, Lens/Optics, Focal Length, Aperture, Shutter Speed, ISO, and Exposure Programs.
- **⚙️ Flickr Sync & API Key Modal**: Zero-config public RSS stream fallback + custom API Key configuration modal.

---

## 🛠️ Technology Stack

- **Framework**: React 19 + Vite 6
- **Styling**: Tailwind CSS v4 (Class-based dark mode variant)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Data Source**: Flickr REST & Public Feeds API

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0 or higher
- **npm** or **yarn** / **pnpm**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/talmalek/PhotoGallerySkin.git
   cd PhotoGallerySkin
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## ⚙️ Flickr Profile Configuration

The target Flickr profile configuration is defined in [`src/services/flickrService.js`](file:///Users/talmalek/Projects/PhotoGallerySkin/src/services/flickrService.js):

```javascript
export const FLICKR_CONFIG = {
  USER_NSID: '126120136@N05',
  USERNAME: 'talmalek',
  PROFILE_URL: 'https://www.flickr.com/photos/126120136@N05/'
};
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
