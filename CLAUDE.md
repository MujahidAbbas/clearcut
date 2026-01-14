# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:4321
npm run build    # Build production site to ./dist/
npm run preview  # Preview production build locally
```

## Architecture

Clearcut is a browser-based AI background removal tool built with Astro + React. All ML inference happens client-side using Transformers.js—no server processing.

### Core Processing Pipeline

1. **Segmentation** (`src/lib/segmentation.ts`): Singleton pipeline using RMBG-1.4 model via Transformers.js. Auto-detects WebGPU, falls back to WASM. Model (~45MB) is cached in IndexedDB.

2. **Compositing** (`src/lib/compositing.ts`): Canvas-based rendering with three background modes: transparent (checkerboard preview), solid color, or image. Uses `destination-in` composite operation to apply mask.

3. **Brush Tool** (`src/lib/brushTool.ts`): Mask refinement via erase/restore brushes. Uses `destination-out` for erasing, `source-over` for restoring. Includes undo/redo via data URL snapshots.

### State Management

Zustand store (`src/stores/appStore.ts`) holds:
- Image state (original image, mask canvas)
- Background settings (type, color, image)
- Brush settings (size, mode)
- UI state (processing, model loading progress)
- History stack (mask snapshots for undo/redo, max 20 entries)

### Component Flow

`BackgroundRemover.tsx` orchestrates four view states:
- `upload` → `processing` → `result` ↔ `editing`

The model initializes on mount. Preview canvas re-renders on mask or background changes.

### Path Alias

`@/*` maps to `src/*` (configured in tsconfig.json).

## Git Commits

Do not include "Co-Authored-By" lines in commit messages.
