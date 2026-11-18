# GTA Style World Map

An interactive real-world web map styled after the Grand Theft Auto (GTA V / Los Santos) pause-menu map, built with **MapLibre GL JS** and **Vite**.

## Features

- **GTA-Inspired Dark Map Palette**: Customizes Carto's `dark-matter-gl-style` vector tiles with dark landcover, high-contrast white/gray road hierarchy, and muted water tones.
- **Coastline Glow & Shoreline Effect**: Adds custom `water-glow` and `water-shoreline` vector layers for the signature GTA map coastline outline.
- **HUD Overlay**: Includes a Los Santos-themed HUD overlay with location info and wanted-level indicator.

## Tech Stack

- [Vite](https://vitejs.dev/)
- [MapLibre GL JS](https://maplibre.org/)
- [Carto Dark Matter Vector Tiles](https://carto.com/basemaps/)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview the production build:**
   ```bash
   npm run preview
   ```
