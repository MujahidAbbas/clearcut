# Architecture

**Analysis Date:** 2026-01-24

## Pattern Overview

**Overall:** Client-side AI image processing with component-based UI state management

**Key Characteristics:**
- All ML inference happens in the browser using Transformers.js (RMBG-1.4 model)
- Zero server-side processing of images (100% private)
- State centralized via Zustand store for reactive UI updates
- Canvas-based image manipulation for segmentation, compositing, and brush editing
- Astro framework for static site generation with React islands for interactive features

## Layers

**Processing Layer (ML & Canvas):**
- Purpose: Handles AI segmentation, image compositing, and mask manipulation
- Location: `src/lib/segmentation.ts`, `src/lib/compositing.ts`, `src/lib/brushTool.ts`
- Contains: RMBG-1.4 model pipeline, canvas rendering logic, brush stroke operations
- Depends on: Transformers.js library, HTML5 Canvas API, browser GPU/WASM capabilities
- Used by: React components (`BackgroundRemover`, `EditingView`) that pass images and masks

**State Management Layer:**
- Purpose: Centralized application state (images, masks, brush settings, UI flags)
- Location: `src/stores/appStore.ts`
- Contains: Zustand store with 14 state properties, 13+ actions, undo/redo history
- Depends on: Zustand library
- Used by: All interactive React components for state reads/writes

**Component Layer (UI):**
- Purpose: Render views and handle user interactions
- Location: `src/components/` (remove/, landing/, ui/)
- Contains: React components for upload, processing, results, editing; Astro pages
- Depends on: Processing layer, state management, UI components
- Used by: Astro pages as entry points

**Presentation Layer:**
- Purpose: Page routing and layout structure
- Location: `src/pages/`, `src/layouts/`
- Contains: Astro files (index, remove, privacy, terms) and shared Layout
- Depends on: Component layer for rendering
- Used by: Browser/router for page navigation

## Data Flow

**Image Upload → Processing → Result:**

1. User selects image via `UploadZone` (drag-drop or file input)
2. `BackgroundRemover` loads image into `HTMLImageElement`, stores in state via `setOriginalImage`
3. `removeBackground()` (segmentation.ts) runs RMBG-1.4 model → returns mask canvas
4. Mask stored in state via `setMaskCanvas`
5. Initial mask snapshot saved to history via `pushHistory()`
6. View state transitions: upload → processing → result

**Result → Editing (Brush Refinement):**

1. User clicks "Edit & Refine" button in `ResultsView`
2. View state changes to `editing`
3. `EditingView` mounts with current mask canvas and original image
4. Canvas element allows mouse/touch drawing with brush tool
5. Each brush stroke calls `drawBrushLine()` to modify mask canvas
6. After stroke ends, mask snapshot saved to history
7. `renderComposite()` re-renders preview with updated mask

**Live Preview Rendering:**

1. Whenever mask or background settings change, composite re-renders
2. `renderComposite()` in `BackgroundRemover` updates preview canvas
3. Three background modes:
   - `transparent`: Renders checkerboard pattern
   - `color`: Fills canvas with solid color
   - `image`: Scales and centers background image
4. Masked foreground applied via canvas `destination-in` composite operation
5. Preview canvas triggers component re-render (previewVersion increment)

**State Management:**

Zustand store holds:
- Image data: `originalImage`, `maskCanvas`
- Background settings: `backgroundType`, `backgroundColor`, `backgroundImage`
- Brush settings: `brushSize`, `brushMode`
- UI state: `isProcessing`, `modelLoaded`, `modelProgress`, `sliderPosition`
- History stack: `history` (array of mask snapshots), `historyIndex`

History is bounded to 20 entries maximum to prevent memory issues. Undo/redo maintains index position within the history array.

## Key Abstractions

**Segmentation Pipeline (Singleton):**
- Purpose: Loads RMBG-1.4 model once, reuses across uploads
- Examples: `src/lib/segmentation.ts` exports `initializeSegmenter()`, `removeBackground()`
- Pattern: Lazy initialization with WebGPU/WASM device detection
- Caching: Model cached in IndexedDB via Transformers.js configuration
- Returns: `HTMLCanvasElement` mask (grayscale alpha values)

**Image Composition System:**
- Purpose: Layered rendering (background + masked subject)
- Examples: `src/lib/compositing.ts` exports `renderComposite()`, `createExportCanvas()`
- Pattern: Canvas `globalCompositeOperation` stacking
- Operations: `destination-in` for masking, `source-over` for restoring
- Variants: Transparent (checkerboard), color fill, image scaling

**Brush Tool Utilities:**
- Purpose: Mask refinement via click-drag strokes
- Examples: `src/lib/brushTool.ts` exports `drawBrushLine()`, `saveMaskSnapshot()`, `restoreMaskSnapshot()`
- Pattern: Canvas stroke operations with mode switching (erase/restore)
- Erase mode: `destination-out` composite removes pixels from mask
- Restore mode: `source-over` composite adds white pixels to mask
- History: Snapshots saved as data URLs after each stroke

**View State Machine:**
- Purpose: Manages the 4 UI states in background removal workflow
- Examples: `BackgroundRemover.tsx` uses TypeScript `type ViewState = 'upload' | 'processing' | 'result' | 'editing'`
- Transitions: upload → processing → result ↔ editing
- Guarded: Processing state prevents interaction until segmentation completes

## Entry Points

**Landing Page:**
- Location: `src/pages/index.astro`
- Triggers: Browser navigation to `/`
- Responsibilities: Renders landing hero, before/after slider, feature grid

**Removal Tool Page:**
- Location: `src/pages/remove.astro`
- Triggers: Browser navigation to `/remove`
- Responsibilities: Mounts `BackgroundRemover` React component with `client:only="react"` directive (requires browser)

**BackgroundRemover Component:**
- Location: `src/components/remove/BackgroundRemover.tsx`
- Triggers: Page load via Astro hydration
- Responsibilities:
  - Initialize RMBG-1.4 model on mount
  - Orchestrate view state transitions
  - Manage image selection flow
  - Render appropriate view component based on state

## Error Handling

**Strategy:** Try-catch in async operations; console.error for logging; fallback to upload state on failure

**Patterns:**

```typescript
// Segmentation errors
try {
  const mask = await removeBackground(img);
} catch (error) {
  console.error('Processing failed:', error);
  setViewState('upload');
}

// Image loading errors
img.onerror = () => {
  URL.revokeObjectURL(objectUrl);
  console.error('Failed to load image');
  setViewState('upload');
};

// Model initialization errors
initializeSegmenter().catch((error) => {
  console.error('Failed to load model:', error);
});
```

Errors do not display user-facing toast/alert messages; they reset state and log to console.

## Cross-Cutting Concerns

**Logging:** Console-based only. No centralized logger. Errors logged with `console.error()`, progress with `console.info()`.

**Validation:** Minimal. File type checked via `file.type.startsWith('image/')` in `UploadZone`. No image dimension limits enforced.

**Authentication:** Not applicable. No user accounts or authentication required.

**Memory Management:**
- Object URLs created with `URL.createObjectURL()` are explicitly revoked with `URL.revokeObjectURL()` to prevent leaks
- History stack limited to 20 snapshots to prevent unbounded memory growth
- Model cached in IndexedDB to avoid re-downloading

**Performance Optimization:**
- Model initializes on landing page load (eager) to improve `/remove` page responsiveness
- WebGPU preferred over WASM for faster inference; automatic fallback if unavailable
- Canvas size matches original image dimensions to avoid scaling performance penalty
- Preview canvas created and reused rather than recreated per render
