# Testing Patterns

**Analysis Date:** 2026-01-24

## Test Framework

**Current State:**
- No test framework configured
- No test files present in codebase
- No testing dependencies in package.json
- Testing is **not implemented**

## Recommended Testing Approach

For future implementation, consider:

**Test Runners (recommended):**
- Vitest - Best for Astro + Vite projects
- Jest - More established but requires additional config
- Astro's built-in testing support

**Assertion Libraries:**
- Vitest's built-in assertions
- Testing Library for component testing
- Node's assert module for utility testing

## Areas Requiring Test Coverage

### 1. Segmentation Module (`src/lib/segmentation.ts`)

**Critical functions to test:**
- `initializeSegmenter()`: Model initialization and caching
- `removeBackground()`: Image processing pipeline
- `getOptimalDevice()`: WebGPU vs WASM detection
- `imageToBlob()`: Image conversion
- `rawImageToCanvas()`: Mask data conversion and scaling

**Testing needs:**
- Mock Transformers.js pipeline
- Test device detection with different browser capabilities
- Verify IndexedDB caching behavior
- Test error handling for initialization failures
- Validate mask output dimensions and data integrity

**Example test structure (Vitest):**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initializeSegmenter, removeBackground } from '@/lib/segmentation';

describe('Segmentation Module', () => {
  describe('initializeSegmenter', () => {
    it('should initialize the pipeline on first call', async () => {
      // Test implementation
    });

    it('should return cached instance on subsequent calls', async () => {
      // Test caching behavior
    });

    it('should call progress callback with progress events', async () => {
      // Mock progress callback
    });
  });

  describe('removeBackground', () => {
    it('should return a canvas with mask data', async () => {
      // Test mask generation
    });

    it('should throw error if segmenter not initialized', async () => {
      // Test error handling
    });
  });

  describe('getOptimalDevice', () => {
    it('should detect WebGPU when available', async () => {
      // Mock navigator.gpu
    });

    it('should fallback to WASM when WebGPU unavailable', async () => {
      // Test fallback
    });
  });
});
```

### 2. Compositing Module (`src/lib/compositing.ts`)

**Critical functions to test:**
- `renderComposite()`: Layer composition logic
- `drawBackground()`: Background rendering (color, image, transparent)
- `drawCheckerboard()`: Checkerboard pattern generation
- `drawMaskedForeground()`: Mask application
- `canvasToBlob()`: Canvas export
- `downloadCanvas()`: File download
- `createExportCanvas()`: Export canvas creation

**Testing needs:**
- Canvas rendering verification (pixel-level or visual regression)
- All background type branches (transparent, color, image)
- Composite operation correctness
- Blob export format and quality
- File download triggering

**Example test structure:**
```typescript
describe('Compositing Module', () => {
  describe('renderComposite', () => {
    it('should render transparent background with checkerboard', () => {
      // Test checkerboard background
    });

    it('should render solid color background', () => {
      // Test color rendering
    });

    it('should render image background with proper scaling', () => {
      // Test image scaling and positioning
    });

    it('should apply mask using destination-in composite', () => {
      // Verify composite operation
    });
  });

  describe('canvasToBlob', () => {
    it('should convert canvas to PNG blob', async () => {
      // Test blob generation
    });

    it('should respect quality parameter', async () => {
      // Test quality settings
    });
  });
});
```

### 3. Brush Tool Module (`src/lib/brushTool.ts`)

**Critical functions to test:**
- `getCanvasCoords()`: Coordinate scaling and DPI handling
- `drawBrushStroke()`: Brush stroke rendering
- `drawBrushLine()`: Line drawing for smooth strokes
- `saveMaskSnapshot()`: Snapshot creation
- `restoreMaskSnapshot()`: Snapshot restoration
- `createBrushCursor()`: Cursor generation

**Testing needs:**
- Canvas coordinate transformation with CSS scaling
- Mouse and touch event handling
- Composite operation correctness (destination-out, source-over)
- Snapshot serialization/deserialization
- Cursor SVG/data-URL generation

**Example test structure:**
```typescript
describe('Brush Tool Module', () => {
  describe('getCanvasCoords', () => {
    it('should convert mouse event to canvas coordinates', () => {
      // Test coordinate mapping
    });

    it('should handle CSS scaling between display and actual canvas size', () => {
      // Test DPI scaling
    });

    it('should work with touch events', () => {
      // Test touch coordinate extraction
    });
  });

  describe('drawBrushStroke', () => {
    it('should erase pixels with destination-out composite', () => {
      // Test erase mode
    });

    it('should restore pixels with source-over composite', () => {
      // Test restore mode
    });
  });

  describe('snapshot functions', () => {
    it('should save and restore mask snapshots', async () => {
      // Test save/restore cycle
    });
  });
});
```

### 4. App Store (`src/stores/appStore.ts`)

**Critical functions to test:**
- State initialization
- All setter actions
- `pushHistory()`: History stack management
- `undo()`: Undo functionality
- `redo()`: Redo functionality
- History limit enforcement (max 20 entries)
- `reset()`: State reset

**Testing needs:**
- Store creation and initial state
- Action execution and state updates
- History stack behavior with branching
- Memory limit enforcement
- Reset clears all state

**Example test structure:**
```typescript
describe('App Store', () => {
  describe('History Management', () => {
    it('should limit history to 20 entries', () => {
      const store = useAppStore.getState();
      // Push 25 snapshots
      // Verify only last 20 are kept
    });

    it('should handle undo/redo correctly', () => {
      // Test undo and redo state changes
    });

    it('should clear future history on new push after undo', () => {
      // Test branching behavior
    });
  });

  describe('Reset', () => {
    it('should reset all state to initial values', () => {
      // Modify state, then reset
      // Verify all properties reset
    });
  });
});
```

### 5. React Components

**Components requiring testing:**

**BackgroundRemover.tsx** (orchestrator component):
- View state transitions (upload → processing → result → editing)
- Model initialization on mount
- Image selection and processing
- Error handling for failures
- Preview canvas rendering

**UploadZone.tsx** (file input):
- Drag and drop handling
- File input selection
- Image type validation
- Disabled state behavior

**EditingView.tsx** (editing canvas):
- Canvas painting (mouse and touch)
- Brush stroke rendering
- Undo/redo functionality
- Download functionality

**Testing approach:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('BackgroundRemover Component', () => {
  it('should initialize model on mount', async () => {
    render(<BackgroundRemover />);
    await waitFor(() => {
      expect(screen.getByText(/Loading AI model/i)).toBeInTheDocument();
    });
  });

  it('should transition to processing state on image select', async () => {
    render(<BackgroundRemover />);
    // Upload image
    // Verify processing state
  });
});
```

## Manual Testing Areas

**Since no automated tests exist, ensure manual testing covers:**

1. **Browser Compatibility:**
   - WebGPU availability and fallback
   - Canvas operations on different browsers
   - Touch events on mobile

2. **Performance:**
   - Model loading time
   - Processing time for various image sizes
   - Memory usage with history

3. **Edge Cases:**
   - Very large images
   - Very small images
   - Rapid undo/redo cycles
   - Long editing sessions (history limit)
   - Network failures during model load

4. **Integration:**
   - Model loading → image processing → editing → export workflow
   - Background switching during editing
   - Brush tool responsiveness

## Suggested Test Setup

For implementing testing, add to `package.json`:

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "happy-dom": "^12.0.0"
  },
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [],
  },
});
```

## Coverage Gaps

**Currently untested:**
- All segmentation logic (model loading, inference, mask generation)
- All canvas operations (compositing, rendering, exports)
- All brush tool operations (coordinate mapping, drawing, history)
- All store state management
- All React component logic (state transitions, event handling)
- All canvas coordinate scaling and DPI handling

**High priority for coverage:**
1. Segmentation pipeline (critical path, external ML dependency)
2. Canvas operations (visual output correctness)
3. History/undo system (user-facing feature)
4. Component state transitions (user workflows)

---

*Testing analysis: 2026-01-24*
