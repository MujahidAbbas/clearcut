# External Integrations

**Analysis Date:** 2026-01-24

## APIs & External Services

**Analytics & Monitoring:**
- Vercel Speed Insights - Real User Monitoring (RUM) for performance metrics
  - SDK/Client: @vercel/speed-insights ^1.3.1
  - Implementation: `src/layouts/Layout.astro` - `<SpeedInsights />` component
  - Data: Page load times, Web Vitals, Core Web Vitals

- Vercel Analytics - Anonymous aggregated analytics
  - SDK/Client: @vercel/analytics ^1.6.1
  - Implementation: `src/layouts/Layout.astro` - `<Analytics />` component
  - Data: Page visits, user interactions (no personal data)

## Data Storage

**Databases:**
- None - Fully client-side application

**File Storage:**
- Browser local storage only (Canvas and IndexedDB)
- No external file hosting integration
- Images processed in-memory and stored as Canvas objects

**Caching:**
- IndexedDB - ML model caching
  - Cache location: Browser IndexedDB (automatic via @huggingface/transformers)
  - Contents: RMBG-1.4 model (~45MB) cached via `env.useBrowserCache = true` in `src/lib/segmentation.ts`
  - Mechanism: Managed by Transformers.js library

## Authentication & Identity

**Auth Provider:**
- None - No user authentication required
- Fully anonymous operation

## Monitoring & Observability

**Error Tracking:**
- Browser console logging only
  - Implementation: `console.error()` calls in error handlers
  - Locations: `src/components/remove/BackgroundRemover.tsx`, `src/lib/segmentation.ts`
  - No external error tracking service integrated

**Logs:**
- Console logging approach
  - Model initialization progress: Progress callback in `initializeSegmenter()`
  - Processing errors logged to console
  - No persistent logging or external log aggregation

## CI/CD & Deployment

**Hosting:**
- Vercel (native Astro + React support)
- Static site generation with client-side rendering for interactive features
- Automatic deployments from git repository

**CI Pipeline:**
- Vercel CI/CD (automatic on pushes)
- Pre-deployment checks built into Vercel

## Environment Configuration

**Required env vars:**
- None explicitly configured
- Vercel integrations use automatic environment detection

**Secrets location:**
- No secrets required for application operation
- Vercel handles analytics tokens automatically

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- Vercel Speed Insights telemetry (anonymous, automatic)
- Vercel Analytics telemetry (anonymous, automatic)

## Model & ML Service

**ML Model:**
- Service: Hugging Face Hub
- Model: RMBG-1.4 (Robust Image Matting - Background Remover v1.4)
  - SDK/Client: @huggingface/transformers ^3.8.1
  - Model URL: briaai/RMBG-1.4 (via Transformers.js)
  - Implementation: `src/lib/segmentation.ts`
    - Pipeline: Image segmentation via `pipeline('image-segmentation', 'briaai/RMBG-1.4')`
    - Device: Auto-detects WebGPU, falls back to WASM
    - Caching: Browser IndexedDB (first load ~45MB download, subsequent loads from cache)

## Privacy & Data Processing

**Data Flow:**
1. User uploads image via browser (File input)
2. Image loaded into HTMLImageElement (local memory)
3. Processed through ML pipeline (client-side only)
4. Segmentation mask generated as Canvas
5. Composite rendering applied (transparent, color, or image background)
6. Output canvas available for download

**No Data Transmission:**
- Images never sent to external servers
- No ML inference on remote servers
- Only anonymous metrics sent to Vercel (page load times, Web Vitals)
- Fully GDPR/privacy-compliant operation

---

*Integration audit: 2026-01-24*
