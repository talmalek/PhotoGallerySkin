# PhotoGallerySkin 📸✨

> A luxury, high-performance web application inspired by `mfrports.com/portfolio/`, designed to stream high-resolution photography live from Flickr and Google Photos with zero local media storage.

🌐 **Live Website**: [https://talmalek.github.io/PhotoGallerySkin/](https://talmalek.github.io/PhotoGallerySkin/)

[![Live Demo](https://img.shields.io/badge/Live_Demo-https%3A%2F%2Ftalmalek.github.io%2FPhotoGallerySkin%2F-emerald?style=for-the-badge&logo=githubpages)](https://talmalek.github.io/PhotoGallerySkin/)

![License](https://img.shields.io/badge/License-MIT-amber.svg)
![React](https://img.shields.io/badge/React-19.0.0-blue.svg)
![Vite](https://img.shields.io/badge/Vite-6.4.3-purple.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4.svg)

---

## 🌟 Overview

**PhotoGallerySkin** transforms photography collections into an authentic, high-fashion portfolio. Built specifically for **Tal Malek** (`@talmalek` / NSID `126120136@N05`), it unifies both **Flickr photostreams** and **Google Photos shared albums** into a single seamless experience featuring dynamic aspect ratio packing, real-time scroll-scrubbed parallax motion, continuous filmstrip marquee reels, and interactive full-screen zoom.

---

## 🔥 Key Features & Signature Motion

- **🌐 Zero Local Storage**: All images, thumbnails, and metadata stream live directly from Flickr (`live.staticflickr.com`) and Google Photos (`lh3.googleusercontent.com`) CDNs.
- **🖼️ Google Photos Shared Albums Integration**:
  - Connect and stream curated Google Photos albums via public sharing links (`photos.app.goo.gl/...`).
  - Zero visitor login required — visitors can immediately browse public albums.
  - Built-in **Google Photos Albums Manager** modal to add, preview, and remove albums.
- **🏷️ Visual Source Identification**:
  - Top navigation and hero header clearly badge album sources (**`FLICKR`** in amber vs. **`GOOGLE`** in emerald).
  - Categorized dropdown menu separating Flickr collections and Google Photos albums.
- **☀️/🌙 Clean Editorial White & Full-Page Night Mode**: Complete theme toggle with smooth background and text transitions (`#ffffff` / `#09090b`).
- **📱 Dual View Modes**:
  - **⚡ Signature Zipper Masonry View (3 Columns)**:
    - **Left Column (Column 0)**: Images arrive from the **Left** (`x: -125px` ➔ `0px`).
    - **Middle Column (Column 1)**: Images **stay centered** (`x: 0px`) and glide vertically (`y: +55px` ➔ `0px`).
    - **Right Column (Column 2)**: Images arrive from the **Right** (`x: +125px` ➔ `0px`).
    - **2-Way Continuous Scrub**: Scrolling DOWN aligns images into position; scrolling BACK UP reverses the animation.
  - **⚡ Matrix View (5 Columns)**: High-density mosaic grid with 120 FPS starfield particle canvas.
- **⚡ Page Pagination Engine (50 / 100 / 200 per page)**: Selectable page size selector (default 200 items per page) with instant performance across the entire 635+ photo collection.
- **📐 Authentic Native Aspect Ratios & Shortest-Column Masonry Height Balancing**:
  - Native aspect ratio preservation (portrait, landscape, panorama) with shortest-column height balancing so columns fill evenly with zero empty gaps.
- **🎬 Hero Filmstrip Marquee**: Continuous infinite horizontal marquee reel at the hero section running at silky-smooth 120 FPS.
- **🔍 Cinema Lightbox with Full-Screen Magnifier Toggle**:
  - Magnifier button toggles between **ZoomIn (`+`)** to expand photo to 100% full browser viewport and **ZoomOut (`-`)** to return to comfortable fit screen.
  - Full keyboard navigation (Arrows, Escape).
  - Slide-out EXIF specs drawer displaying Camera Body, Optics, Focal Length, Aperture, Shutter Speed, and ISO.
- **⚙️ Dynamic Flickr Key Extractor**: Real-time live guest key extraction directly from Flickr web profiles.

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
