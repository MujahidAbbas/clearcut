# Codebase Concerns

**Analysis Date:** 2026-01-24

## Tech Debt

**History/Undo-Redo Implementation Using Data URLs:**
- Issue: Mask snapshots stored as data URLs (PNG encoded strings in memory). With 20-entry history limit at 4K image sizes, each snapshot can consume 10-30MB. No cleanup mechanism for old history entries if limit increased.
- Files: `src/stores/appStore.ts` (line 77-86), `src/lib/brushTool.ts` (line 104-106)
- Impact: High memory consumption on large images; potential browser memory exhaustion during editing sessions; risk of out-of-memory errors on devices with limited RAM
- Fix approach: Replace data URL snapshots with IndexedDB storage using blob URLs, or implement a more granular diff-based history system (only storing delta masks rather than full snapshots)

**Canvas Memory Leaks on Re-renders:**
- Issue: Temporary canvases created in `drawMaskedForeground` and `rawImageToCanvas` are never explicitly released. Browser garbage collection may be delayed, and on long editing sessions multiple temporary canvases accumulate.
- Files: `src/lib/compositing.ts` (line 95-110), `src/lib/segmentation.ts` (line 128-149)
- Impact: Gradual memory buildup during extended editing sessions; potential browser sluggishness or crash on very large images
- Fix approach: Add explicit canvas cleanup: `canvas.remove()` or consider using OffscreenCanvas and web workers for background processing

**Singleton Segmenter Pipeline No Cleanup:**
- Issue: Global segmenter instance (`src/lib/segmentation.ts` line 9) initialized once and never destroyed. No mechanism to unload the 45MB RMBG-1.4 model if user navigates away or closes the app.
- Files: `src/lib/segmentation.ts` (line 9, 19-32)
- Impact: Model stays in memory indefinitely; wastes resources if user only processes one image then navigates; IndexedDB cache grows unbounded
- Fix approach: Add `destroySegmenter()` export to unload model; call on component unmount or route change. Consider lazy-loading model only when entering the removal tool.

**No Error Recovery Path for Model Loading:**
- Issue: If model loading fails mid-process (network interruption, corrupted cache), user is stuck and must refresh browser. No fallback mechanism.
- Files: `src/components/remove/BackgroundRemover.tsx` (line 38-48), `src/lib/segmentation.ts` (line 19-32)
- Impact: Poor UX on unreliable networks; no way to retry failed downloads
- Fix approach: Add retry logic with exponential backoff; cache error state and provide "Retry" button; clear IndexedDB cache on persistent failures

**Object URL Not Always Cleaned on Error:**
- Issue: In `BackgroundRemover.tsx` handleImageSelect, if img.onerror occurs, objectUrl is revoked. However, if intermediate promises reject, cleanup may not happen.
- Files: `src/components/remove/BackgroundRemover.tsx` (line 70-118)
- Impact: Memory leak of blob URLs if image processing fails at certain stages
- Fix approach: Use try-finally block to guarantee objectUrl cleanup regardless of error path

**No Input Validation for Background Images:**
- Issue: Background images uploaded via `BackgroundPanel.tsx` are not validated for file size, resolution, or format. User could upload massive images (4K+) causing rendering performance issues.
- Files: `src/components/remove/BackgroundPanel.tsx` (line 24-39)
- Impact: Potential UI freeze or crash if user selects very large background image
- Fix approach: Validate image dimensions (max 8K), file size (max 10MB), and optionally re-encode/resize before storing

## Known Bugs

**Model Loading Progress Can Exceed 100%:**
- Symptoms: Progress bar shows >100% momentarily during model download completion
- Files: `src/components/remove/BackgroundRemover.tsx` (line 165), `src/lib/segmentation.ts` (line 38-42)
- Trigger: Load segmentation model for first time; observe progress percentage
- Workaround: Progress is capped visually in CSS but internally can exceed 100%; not blocking functionality
- Note: Partially fixed in commit bddb89e; verify progress callback doesn't emit values >100%

**Mask Scaling Artifact on Non-Square Images:**
- Symptoms: Segmentation mask may appear misaligned on highly rectangular images (e.g., 16:9 aspect)
- Files: `src/lib/segmentation.ts` (line 126-149) - scaling logic only checks width/height mismatch, not aspect ratio preservation
- Trigger: Upload image with aspect ratio > 2:1 and compare mask to original in slider
- Workaround: Use more square-like images (1:1 to 4:3 aspect ratio)
- Note: This is a model-specific issue (RMBG-1.4 may scale internally); verify with test images

**Touch Events Don't Reset Properly in EditingView:**
- Symptoms: After finishing touch-based brush stroke, next touch sometimes draws at wrong position
- Files: `src/components/remove/EditingView.tsx` (line 92-130) - handleTouchEnd doesn't set lastPos.current to null in all code paths
- Trigger: Use mobile browser, touch-paint multiple strokes, note position jump on subsequent strokes
- Workaround: Wait 1-2 seconds between brush strokes on touch devices
- Note: Difficult to reproduce; may depend on browser/OS

## Security Considerations

**File Upload No MIME Type Validation:**
- Risk: Client only checks `file.type` which can be spoofed; malicious JS files with image extension could be processed
- Files: `src/components/remove/UploadZone.tsx` (line 27), `src/components/remove/BackgroundPanel.tsx` (line 24-39)
- Current mitigation: Browser file input `accept="image/*"` provides UI-level filtering; actual canvas operations require valid image format
- Recommendations: Add server-side validation if uploading to backend in future; consider verifying image headers (magic bytes) before processing; implement file size limits (current: unlimited)

**No XSS Protection on Color Input:**
- Risk: Color input via text field (`BackgroundPanel.tsx` line 128-133) accepts raw user input; could theoretically inject CSS or HTML if not validated
- Files: `src/components/remove/BackgroundPanel.tsx` (line 128-133)
- Current mitigation: React auto-escapes string values; CSS color validation done by browser (invalid colors ignored)
- Recommendations: Validate color input against CSS color regex; use color picker-only mode to eliminate text input

**Model Loading from Hugging Face (External CDN):**
- Risk: RMBG-1.4 model (~45MB) loaded from external CDN; no checksum verification; compromised CDN could serve malicious model
- Files: `src/lib/segmentation.ts` (line 27)
- Current mitigation: Transformers.js caches in IndexedDB; once cached, doesn't re-download; HTTPS provides transport security
- Recommendations: Implement subresource integrity (SRI) if available in Transformers.js; provide model hash verification; consider self-hosting model for production

## Performance Bottlenecks

**Model Loading Blocks UI on Initial Visit:**
- Problem: 45MB model download blocks render until complete; first-time users see blank/disabled upload screen for 30-60 seconds on slow networks
- Files: `src/components/remove/BackgroundRemover.tsx` (line 36-48), `src/lib/segmentation.ts` (line 19-32)
- Cause: `initializeSegmenter()` called synchronously on mount; no streaming/progressive enhancement
- Improvement path: Move model initialization to service worker or background thread; show "Loading..." state but allow navigation; implement model pre-loading on page idle time
- Current impact: Bounce rate risk for first-time users on 3G/LTE networks

**Canvas Re-render on Every Background Change:**
- Problem: Changing background color/type re-renders entire composite canvas, including re-drawing original image
- Files: `src/components/remove/BackgroundRemover.tsx` (line 50-68), `src/components/remove/EditingView.tsx` (line 41-55)
- Cause: `renderComposite()` clears entire canvas and redraws all layers instead of selective updates
- Improvement path: Cache background layer separately; only composite background when type/color changes, not on every render; use requestAnimationFrame for batching
- Current impact: Noticeable lag when quickly switching between background options on large (4K+) images

**Brush Stroke History Snapshots Too Frequent:**
- Problem: History snapshot created on every mouse/touch "up" event; rapid strokes generate 10+ snapshots/second, each 10-30MB for 4K images
- Files: `src/components/remove/EditingView.tsx` (line 83-90, 124-130), `src/lib/brushTool.ts` (line 104-106)
- Cause: No debouncing; every brush stroke end saves full PNG snapshot to history
- Improvement path: Debounce history snapshots (500ms minimum between saves); implement stroke-level diffing instead of full snapshots; use canvas dirty regions
- Current impact: 30-50MB memory consumption per minute of editing on 4K images

**ComparisonSlider Creates Duplicate Canvases:**
- Problem: ComparisonSlider copies original and preview canvases to separate internal canvases (line 26-31, 37-42), then re-copies on every previewVersion change
- Files: `src/components/remove/ComparisonSlider.tsx` (line 24-43)
- Cause: `useEffect` dependencies include previewCanvas, which triggers full re-copy
- Improvement path: Use canvas.drawImage() with source region instead of full copy; implement canvas pooling to reuse canvases across renders
- Current impact: ~15-20% extra memory overhead for slider component

**No Lazy Loading for UI Components:**
- Problem: All UI imported upfront (Header, Hero, FeaturesGrid, Footer); landing page loads unused component code for editing views
- Files: `src/pages/index.astro`, `src/components/` directory structure
- Cause: No code splitting or dynamic imports for tool-specific components
- Improvement path: Use React.lazy() and Suspense; or split into separate Astro pages
- Current impact: ~50KB extra JavaScript on landing page

## Fragile Areas

**Zustand Store Directly Holds HTMLElement References:**
- Files: `src/stores/appStore.ts` (line 6-7, 12, 30)
- Why fragile: Storing HTMLImageElement and HTMLCanvasElement in store can cause issues if elements are garbage collected or replaced; no serialization possible; breaks time-travel debugging
- Safe modification: Only store image data (pixels/blob) or canvas data URL, not DOM elements; pass elements as props instead
- Test coverage: No tests for store serialization or element lifecycle

**Canvas getContext() Called Without Null Checks in Some Paths:**
- Files: `src/lib/brushTool.ts` (line 47-48, 79-80) - returns early but doesn't throw; `src/lib/compositing.ts` (line 99-100) - silent return
- Why fragile: If canvas context fails to initialize (rare but possible), operations silently fail with no error logged; difficult to debug
- Safe modification: Throw error or log warning instead of silent failure; add try-catch wrapper around all canvas operations
- Test coverage: No test cases for getContext() failure scenarios

**Hardcoded History Limit of 20 Entries:**
- Files: `src/stores/appStore.ts` (line 82)
- Why fragile: No configuration option; if multiple users with different image sizes use app, some will have insufficient history depth for their use case
- Safe modification: Make configurable based on available memory; implement adaptive history pruning (keep time-based history instead of count-based)
- Test coverage: No tests verifying history limit enforcement

**Event Listener Memory Leak in ComparisonSlider:**
- Files: `src/components/remove/ComparisonSlider.tsx` (line 66-73)
- Why fragile: `mousemove` and `mouseup` listeners attached to document but cleanup only in return function; if component unmounts during drag, listeners may persist
- Safe modification: Store event listener references separately; check isDragging.current before executing handlers; consider pointer events API instead
- Test coverage: No tests for cleanup on unmount

**Brush Scale Factor Not Validated:**
- Files: `src/lib/brushTool.ts` (line 45, 85) - scale parameter passed from EditingView but never validated
- Why fragile: If scale becomes 0 or negative, brush strokes behave unexpectedly; if scale > 10, brush becomes huge
- Safe modification: Clamp scale to valid range (0.1 - 10); throw error on invalid scale
- Test coverage: No unit tests for brushTool functions

**No Bounds Checking for Slider Position:**
- Files: `src/components/remove/ComparisonSlider.tsx` (line 45-50) - Math.max/min prevents overflow, but downstream code assumes 0-100
- Why fragile: If onSliderChange callback receives invalid value, state becomes inconsistent; CSS clip-path with >100% behaves unexpectedly
- Safe modification: Validate in store setter; throw error if value outside 0-100 range
- Test coverage: No tests for boundary conditions

## Scaling Limits

**Large Image Processing Memory Ceiling:**
- Current capacity: 4K images (~33MB raw pixels) can be processed but consume:
  - Original image: ~33MB
  - Mask canvas: ~8MB (alpha channel only, internally RGBA)
  - Temporary canvases: ~40MB (multiple during processing)
  - History (20 snapshots): ~200-600MB (depending on format)
  - Total: 280-700MB for single 4K image with full history
- Limit: Browser tab crashes on 8K+ images or when memory exceeds 1GB
- Scaling path: Implement image tiling for processing; use OffscreenCanvas in Web Workers; stream processing instead of full-image-at-once; implement memory-aware history pruning

**Concurrent User Processing (If Backend Added):**
- Current capacity: Single-user, browser-only; no backend scaling concerns
- Limit: N/A - not applicable to client-side app
- Scaling path: If moving to server-side processing, implement job queue with worker pool; consider GPU acceleration (CUDA/OpenGL)

**IndexedDB Model Cache Growth:**
- Current capacity: RMBG-1.4 model ~45MB; browser IndexedDB quota typically 50-100GB
- Limit: After loading multiple versions of model or multiple models, quota could be exhausted on shared browser profile
- Scaling path: Implement cache management UI (show cache size, allow clearing); use named versions for models; implement TTL-based cache expiry

## Dependencies at Risk

**@huggingface/transformers v3.8.1:**
- Risk: Major version 3.x; library actively developed but rapidly evolving API; WASM backend not guaranteed stable
- Impact: Breaking changes in minor versions could disable model loading; WASM bundle size could increase
- Migration plan: Monitor release notes; pin to patch version `^3.8.1`; test major version upgrades in staging; have fallback model provider ready (ONNX Runtime, TensorFlow.js)

**zustand v5.0.10:**
- Risk: State management library; major version jump recently; no built-in time-travel debugging or DevTools support
- Impact: Store mutation issues hard to debug; no way to inspect state history
- Migration plan: Good risk profile (small, stable); use Zustand DevTools middleware for debugging; avoid direct state mutations

**astro v5.16.9:**
- Risk: Rapid development (5.x major version); some integrations may lag behind
- Impact: React integration could break; build output changes could affect deployment
- Migration plan: Keep up with Astro releases; test builds before deployment; have rollback plan

**@transformers.js (Dependency of Hugging Face):**
- Risk: WASM/WebGPU backends are experimental in browsers; fallback chains (WASM -> CPU) may fail
- Impact: Model inference could fail on browsers without WebGPU support; WASM fallback slower (10x slower)
- Migration plan: Monitor browser compatibility; implement graceful degradation; warn users on unsupported browsers; add feature detection tests

## Missing Critical Features

**No Offline Support:**
- Problem: Model (45MB) cached in browser but requires initial download; no offline mode for air-gapped environments
- Blocks: Users on disconnected networks; enterprise environments without external internet access
- Workaround: Download model on initial visit; use service worker to enable offline mode for subsequent visits
- Fix: Implement service worker with proper cache-first strategy; pre-cache model in web app manifest

**No Batch Processing:**
- Problem: Process one image at a time; no way to remove background from 50 product photos in one session
- Blocks: Commercial/e-commerce use cases; efficiency for bulk operations
- Workaround: Process images one-by-one, download after each
- Fix: Add "Process Multiple" mode with queue UI; implement batch download as ZIP

**No Background Image Library:**
- Problem: User can upload custom background images but no pre-built library of common backgrounds (blur, gradient, patterns)
- Blocks: Quick background swaps for professional look
- Workaround: User must upload own background images
- Fix: Add preset backgrounds UI; lazy-load background library from CDN

**No Undo/Redo Keyboard Shortcuts:**
- Problem: History is implemented but no Ctrl+Z / Cmd+Z keybinding
- Blocks: Power users; desktop workflow integration
- Workaround: Click undo/redo buttons
- Fix: Add global keyboard listener for Ctrl+Z/Cmd+Z; implement in `EditingView.tsx`

**No Export Format Options:**
- Problem: Only exports PNG; no WebP, JPEG, or other formats
- Blocks: Users wanting specific formats; file size optimization
- Workaround: Use external converter after download
- Fix: Add export format selector (PNG, WebP, JPEG with quality slider); update `downloadCanvas()` to accept format parameter

## Test Coverage Gaps

**No Unit Tests for Core Segmentation Logic:**
- What's not tested: `removeBackground()`, `rawImageToCanvas()`, model initialization success/failure, device detection (WebGPU vs WASM)
- Files: `src/lib/segmentation.ts` (entire file)
- Risk: Regression in mask generation quality goes unnoticed; WebGPU fallback logic untested; model corruption not caught
- Priority: HIGH - core feature

**No Integration Tests for Image Upload Flow:**
- What's not tested: File drag-drop, model loading + image processing pipeline, error recovery (network failures during download)
- Files: `src/components/remove/BackgroundRemover.tsx`, `src/components/remove/UploadZone.tsx`
- Risk: Regression in upload flow (e.g., broken object URL cleanup) only caught in manual testing
- Priority: HIGH - user-facing feature

**No Tests for History/Undo-Redo:**
- What's not tested: History limit enforcement, snapshot data format, undo/redo ordering, history mutation edge cases
- Files: `src/stores/appStore.ts` (line 77-102), `src/lib/brushTool.ts` (snapshot functions)
- Risk: History data corruption goes unnoticed; undo skips entries or goes backwards; memory leaks from snapshots
- Priority: MEDIUM - feature complexity

**No Tests for Canvas Operations:**
- What's not tested: `renderComposite()`, background rendering modes, mask application, export canvas creation
- Files: `src/lib/compositing.ts`, `src/lib/brushTool.ts`
- Risk: Rendering bugs (incorrect alpha blending, color mixing) only caught visually; export output quality untested
- Priority: MEDIUM - visual quality

**No Tests for Touch Event Handling:**
- What's not tested: Touch start/move/end event sequences, multi-touch scenarios, touch vs mouse mixed input
- Files: `src/components/remove/EditingView.tsx` (touch handlers), `src/components/remove/ComparisonSlider.tsx`
- Risk: Touch event bugs only discovered by mobile testers; regression in mobile UX unnoticed
- Priority: MEDIUM - mobile platform

**No E2E Tests:**
- What's not tested: Full user workflows (upload -> process -> edit -> export); browser compatibility (Chrome, Firefox, Safari); performance benchmarks
- Files: Entire application
- Risk: Critical bugs only found in production; no performance regression detection; cross-browser issues unknown
- Priority: LOW - can be added later; manual testing sufficient for MVP

---

*Concerns audit: 2026-01-24*
