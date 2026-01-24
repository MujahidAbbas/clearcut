# Technology Stack

**Analysis Date:** 2026-01-24

## Languages

**Primary:**
- TypeScript - Full codebase (frontend components, utilities, type definitions)
- JSX/TSX - React component syntax for UI rendering

**Secondary:**
- JavaScript - Astro configuration files
- CSS - Global styles via Tailwind CSS

## Runtime

**Environment:**
- Node.js (v24.3.0 or compatible)

**Package Manager:**
- npm
- Lockfile: package-lock.json (present)

## Frameworks

**Core:**
- Astro ^5.16.9 - Static site generation and page routing
- React ^19.2.3 - UI component framework for interactive features
- @astrojs/react ^4.4.2 - Astro integration for React components

**Styling:**
- Tailwind CSS ^4.1.18 - Utility-first CSS framework
- @tailwindcss/vite ^4.1.18 - Vite plugin for Tailwind CSS compilation

**Icons:**
- astro-icon ^1.1.5 - Icon components for Astro
- @iconify/react ^6.0.2 - Icon library for React
- @iconify-json/lucide ^1.2.84 - Lucide icon set

**State Management:**
- zustand ^5.0.10 - Lightweight state management store (`src/stores/appStore.ts`)

## Key Dependencies

**Critical:**
- @huggingface/transformers ^3.8.1 - ML inference library for image segmentation (RMBG-1.4 model). Excluded from Vite optimizeDeps due to large size and browser-specific code. Models cached in IndexedDB (~45MB).

**Infrastructure:**
- @vercel/analytics ^1.6.1 - Anonymous performance metrics and web vitals collection
- @vercel/speed-insights ^1.3.1 - Real-world speed metrics tracking
- React DOM ^19.2.3 - React DOM utilities for rendering
- @types/react ^19.2.8 - TypeScript types for React
- @types/react-dom ^19.2.3 - TypeScript types for React DOM

## Configuration

**TypeScript:**
- Config: `tsconfig.json`
- Extends: astro/tsconfigs/strict
- Path aliases: `@/*` → `src/*`
- JSX: react-jsx import source

**Build:**
- Config: `astro.config.mjs`
- Integrations: react(), icon()
- Vite plugins: tailwindcss()
- Optimizations: @huggingface/transformers excluded from dependency optimization

**Environment:**
- No .env file detected. Vercel integrations use automatic environment detection.

## Platform Requirements

**Development:**
- Node.js (v18+)
- npm/node version manager

**Production:**
- Deployment: Vercel (native Astro + React support)
- Client-side processing only (no server-side ML inference)
- Browser support: WebGPU (preferred) with WebAssembly fallback

## Client-Side Runtimes

**ML Inference:**
- WebGPU (GPU-accelerated, auto-detected)
- WebAssembly (WASM fallback if WebGPU unavailable)
- Model detection in `src/lib/segmentation.ts`: `getOptimalDevice()` function

**Storage:**
- IndexedDB (for caching ML models)
- Canvas API (for image processing and mask generation)

---

*Stack analysis: 2026-01-24*
