# PhotoGallerySkin 📸✨

> A luxury, high-performance web application inspired by `mfrports.com/portfolio/`, designed to stream high-resolution photography live from Flickr profiles with zero local media storage.

🌐 **Live Website**: [https://talmalek.github.io/PhotoGallerySkin/](https://talmalek.github.io/PhotoGallerySkin/)

[![Live Demo](https://img.shields.io/badge/Live_Demo-https%3A%2F%2Ftalmalek.github.io%2FPhotoGallerySkin%2F-emerald?style=for-the-badge&logo=githubpages)](https://talmalek.github.io/PhotoGallerySkin/)

![License](https://img.shields.io/badge/License-MIT-amber.svg)
![React](https://img.shields.io/badge/React-19.0.0-blue.svg)
![Vite](https://img.shields.io/badge/Vite-6.4.3-purple.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4.svg)

---

## 🌟 Overview

**PhotoGallerySkin** transforms Flickr photostreams and album collections into an authentic, high-fashion photography portfolio. Built specifically for **Tal Malek** (`@talmalek` / NSID `126120136@N05`), it features dynamic aspect ratio packing, real-time scroll-scrubbed parallax motion, continuous filmstrip marquee reels, and interactive viewport-gated starfield proximity repulsion.

---

## 🔥 Key Features & Signature Motion

- **🌐 Zero Local Storage**: All images, thumbnails, and metadata stream live directly from Flickr's global CDN (`live.staticflickr.com`).
- **☀️/🌙 Clean Editorial White & Full-Page Night Mode**: Complete theme toggle with smooth background and text transitions (`#ffffff` / `#09090b`).
- **📱 Dual View Modes**:
  - **⚡ Signature Zipper Masonry View (3 Columns)**:
    - **Left Column (Column 0)**: Images arrive from the **Left** (`x: -125px` ➔ `0px`).
    - **Middle Column (Column 1)**: Images **stay centered** (`x: 0px`) and glide vertically (`y: +55px` ➔ `0px`).
    - **Right Column (Column 2)**: Images arrive from the **Right** (`x: +125px` ➔ `0px`).
    - **2-Way Continuous Scrub**: Scrolling DOWN aligns images into position; scrolling BACK UP reverses the animation and returns every image to its starting offscreen position.
  - **✨ Matrix View (5–6 Columns)**:
    - **Ambient Starfield Background**: Canvas-rendered starlight particles drifting smoothly in 120 FPS.
    - **Starfield Proximity Repulsion**: Each image card behaves like a star floating in space. When the mouse cursor moves close to an image, **only that specific image repels slowly away from the cursor by a small margin (up to 22px)** with soft spring physics (`stiffness: 180, damping: 24`).
    - **Viewport-Gated Performance (`useInView`)**: Proximity math executes ONLY on cards currently visible in the active viewport (~15–20 cards), ensuring 120 FPS zero-lag scrolling even on large photostreams (500+ items).
- **🎬 Hero Filmstrip Marquee**: Continuous infinite horizontal marquee reel at the hero section running at silky-smooth 120 FPS.
- **🏷️ Authentic Flickr Metadata**: Preserves real photo titles and original camera filenames (`DSC04892`, `IMG_2023...`).
- **🔍 Cinema Lightbox & EXIF Drawer**:
  - Full-screen high-res lightbox with keyboard arrow navigation.
  - Interactive slide-out EXIF specs drawer displaying Camera Body, Lens/Optics, Focal Length, Aperture, Shutter Speed, ISO, and Exposure Programs.
- **⚙️ Flickr Sync & API Key Modal**: Zero-config public RSS stream fallback + custom API Key configuration modal.

---

## 🛠️ Technology Stack

- **Framework**: React 19 + Vite 6
- **Styling**: Tailwind CSS v4 (Class-based dark mode variant)
- **Animations**: Framer Motion (`useScroll`, `useTransform`, `useSpring`, `useInView`)
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
