# Coding Conventions

**Analysis Date:** 2026-01-24

## Naming Patterns

**Files:**
- PascalCase for React components: `BackgroundRemover.tsx`, `UploadZone.tsx`, `Button.tsx`
- camelCase for utility/library files: `segmentation.ts`, `compositing.ts`, `brushTool.ts`
- camelCase for store files: `appStore.ts`
- camelCase for style files: `globals.css`

**Functions:**
- camelCase for all functions: `initializeSegmenter()`, `removeBackground()`, `renderComposite()`, `drawBrushLine()`
- Prefix boolean functions with verbs when appropriate: `isSegmenterReady()`
- Handler functions prefixed with `handle`: `handleImageSelect()`, `handleMouseDown()`, `handleDragOver()`
- Callback props prefixed with `on`: `onImageSelect`, `onProgress`, `onBack`, `onReset`

**Variables:**
- camelCase for all variables: `isDrawing`, `lastPos`, `maskCanvas`, `originalImage`
- Use descriptive names: `previewCanvasRef`, `historyIndex`, `brushSize`
- Refs end with `Ref`: `previewCanvasRef`, `canvasRef`, `inputRef`
- Boolean variables start with `is` or `can`: `isProcessing`, `modelLoaded`, `canUndo`, `isDragOver`

**Types/Interfaces:**
- PascalCase for all interfaces: `AppState`, `ButtonProps`, `BrushStroke`, `UploadZoneProps`, `EditingViewProps`
- Suffix `Props` for component prop interfaces: `ButtonProps`, `UploadZoneProps`, `BadgeProps`
- Suffix `Callback` for callback function types: `ProgressCallback`

**Constants:**
- camelCase for most constants: `initialState`, `squareSize`, `colors`
- Variants object as camelCase key with variant names: `variants = { primary: '...', secondary: '...' }`

## Code Style

**Formatting:**
- No automatic formatter detected (no Prettier or ESLint config files)
- Code uses consistent 2-space indentation throughout
- Trailing semicolons are used
- String quotes: single quotes preferred in most files (JSX uses double quotes for attributes)

**Linting:**
- No ESLint or linter configuration detected
- Code follows TypeScript strict mode (tsconfig.json extends `astro/tsconfigs/strict`)

## Import Organization

**Order:**
1. React and third-party imports: `import { useState, useRef } from 'react'`
2. Component imports (relative): `import Button from '../ui/Button'`
3. Library/utility imports: `import { initializeSegmenter, removeBackground } from '../../lib/segmentation'`
4. Store imports: `import { useAppStore } from '../../stores/appStore'`

**Path Aliases:**
- `@/*` maps to `src/*` (configured in tsconfig.json)
- Not heavily used; relative imports are preferred: `../../lib/`, `../ui/`

**Default Exports:**
- React components use named default exports: `export default function Button() { }`
- Store uses named export: `export const useAppStore = create<AppState>()`
- Utilities use named exports for multiple items or default export for single function

## Error Handling

**Patterns:**
- Try-catch blocks used for async operations and critical failures
- Errors logged to console with `console.error()`: `console.error('Failed to load model:', error)`
- Errors propagated with `throw new Error()` for initialization failures: `throw new Error('Segmenter not initialized. Call initializeSegmenter first.')`
- Null coalescing and optional chaining for fallback handling: `backgroundImage ?? undefined`
- Guard clauses for early returns: `if (!ctx) return;` or `if (!canvasRef.current) return;`

**Examples:**
```typescript
// segmentation.ts - Error handling with throw
if (!ctx) throw new Error('Failed to get canvas context');

// BackgroundRemover.tsx - Try-catch for async operations
try {
  const mask = await removeBackground(img);
  setMaskCanvas(mask);
} catch (error) {
  console.error('Processing failed:', error);
  setViewState('upload');
}

// brushTool.ts - Guard clauses
export function drawBrushStroke(
  maskCanvas: HTMLCanvasElement,
  stroke: BrushStroke,
  scale: number = 1
): void {
  const ctx = maskCanvas.getContext('2d');
  if (!ctx) return;
  // ...
}
```

## Logging

**Framework:** Plain `console` methods

**Patterns:**
- `console.error()` for errors: `console.error('Failed to load model:', error)`
- Errors logged when critical operations fail
- No structured logging or logging library used
- Limited logging overall; errors are primary focus

## Comments

**When to Comment:**
- Function purpose documented with JSDoc comments: `/** ... */`
- Complex logic explained with inline comments
- Algorithm descriptions for non-obvious operations

**JSDoc/TSDoc:**
- Used for public functions, especially in lib files
- Includes param and return type documentation
- Format: `/** ... */` on lines before function

**Examples:**
```typescript
/**
 * Initialize the segmentation pipeline
 * Downloads and caches the model in IndexedDB
 */
export async function initializeSegmenter(
  onProgress?: ProgressCallback
): Promise<ImageSegmentationPipeline> { }

/**
 * Detect if WebGPU is available, fallback to WASM
 */
async function getOptimalDevice(): Promise<'webgpu' | 'wasm'> { }

/**
 * Process an image and return the segmentation mask
 */
export async function removeBackground(
  image: HTMLImageElement
): Promise<HTMLCanvasElement> { }
```

## Function Design

**Size:** Generally 10-50 lines per function. Larger functions exist for complex logic like compositing and canvas operations.

**Parameters:**
- Destructured from objects when multiple related parameters: `{ x, y, size, mode }` in BrushStroke
- Callback functions passed as last parameter: `onProgress?: ProgressCallback`
- Default parameters used for optional configuration: `scale: number = 1`, `type = 'image/png'`
- Canvas context 2D and image elements passed directly (not wrapped)

**Return Values:**
- Early return pattern for guard clauses: `if (!ctx) return;`
- Async functions return Promises with clear types: `Promise<HTMLCanvasElement>`, `Promise<void>`
- Null/undefined returned for optional/fallback operations

## Module Design

**Exports:**
- Components export default as named function: `export default function ComponentName() { }`
- Utilities export named functions: `export async function removeBackground() { }`
- Store exports const with hook pattern: `export const useAppStore = create()`
- Interfaces exported as named exports: `export interface ButtonProps { }`

**Barrel Files:** Not used; components imported directly from their files.

**Organizing Large Components:**
- UI components broken into subcomponents: `Button`, `Badge`, `Container`, `Spinner`
- Feature components have dedicated subdirectories: `/components/remove/`, `/components/landing/`
- Libraries handle specific domains: `segmentation.ts`, `compositing.ts`, `brushTool.ts`

## React Patterns

**Component Structure:**
- Functional components with hooks
- State managed via Zustand store for shared state
- Local state via `useState` for UI-only state (drag state, drawing state)
- Refs via `useRef` for canvas and input references

**Hook Usage:**
- `useCallback` for event handlers to prevent unnecessary re-renders
- `useEffect` for initialization and side effects
- `useRef` for DOM references and mutable values (isDrawing flag)
- Store hook `useAppStore()` for global state access

**Props Pattern:**
- Interface extends HTML attributes when appropriate: `ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>`
- Optional className prop on UI components: `className?: string`
- Required children prop typed as `ReactNode`
- Spread remaining props: `{...props}`

**Example Component Structure:**
```typescript
interface ComponentProps extends BaseProps {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

export default function Component({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ComponentProps) {
  // Implementation
}
```

## TypeScript Patterns

**Type Usage:**
- Strict mode enabled (extends `astro/tsconfigs/strict`)
- Type imports using `import type` when only types are needed: `import type { ImageSegmentationPipeline } from '@huggingface/transformers'`
- Union types for restricted values: `'transparent' | 'color' | 'image'`
- Interface composition for extending HTML element attributes

**Generic Types:**
- Used for store creation: `create<AppState>()`
- Pipeline types from external libraries: `ImageSegmentationPipeline`

---

*Convention analysis: 2026-01-24*
