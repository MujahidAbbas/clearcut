# Clearcut

**Free, unlimited, and 100% private AI background removal - right in your browser.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Built with Astro](https://img.shields.io/badge/Built%20with-Astro-FF5D01.svg)](https://astro.build)
[![Powered by Transformers.js](https://img.shields.io/badge/Powered%20by-Transformers.js-FFD21E.svg)](https://huggingface.co/docs/transformers.js)

---

## Overview

Clearcut is a privacy-first background removal and image editing tool that runs entirely in your browser. No uploads, no servers, no subscriptions - just instant, studio-quality results powered by AI. Remove backgrounds, apply custom backgrounds, adjust filters, transform images, and crop to specific aspect ratios - all without your images ever leaving your device.

### Key Features

- **100% Private** - Your images never leave your device. All processing happens locally in your browser.
- **Unlimited & Free** - No usage limits, no watermarks, no accounts required.
- **Instant Processing** - Powered by WebGPU/WASM for fast inference.
- **Studio-Grade Quality** - Uses the RMBG-1.4 model for precise edge detection and hair handling.

#### Background Removal & Editing
- **Brush Editing** - Fine-tune results with erase/restore brush tools.
- **Undo/Redo** - Up to 20 history entries for brush edits.
- **Before/After Comparison** - Interactive slider to compare original and edited images.

#### Edge Refinement
- **Refine Edges Modal** - Dedicated overlay for precision mask editing with zoom/pan support.
- **Eraser Tool** - Remove leftover background artifacts the AI missed.
- **Restore Tool** - Bring back accidentally removed details like hair edges, fingers, etc.
- **Zoom Controls** - 1.0x to 4.0x zoom for precision work on fine details.
- **Pan Navigation** - Hold Space + drag (desktop) or two-finger drag (mobile) to navigate zoomed canvas.
- **Touch Gestures** - Pinch-to-zoom and two-finger pan for mobile devices.
- **Reset All Edits** - Revert all refinement strokes back to the original state.

#### Image Editing Modal
- **Full-Screen Editor** - Immersive editing experience with real-time preview.
- **Background Selection** - Choose from 12 preset colors, custom color picker, or upload your own background image.
- **Background Filters** - Adjust brightness (0-200%), contrast (0-200%), saturation (0-200%), and blur (0-20px) on backgrounds.
- **Transform Controls**:
  - Zoom: 0.5x to 3.0x with interactive canvas zoom (zoom toward cursor position).
  - Rotate: 90-degree increments left or right.
  - Flip: Horizontal and vertical mirroring with active state indicators.
- **Aspect Ratio Cropping** - Interactive crop tool with 6 aspect ratio options (Original, Free, 1:1, 4:3, 16:9, 9:16).
- **Crop Overlay** - Visual crop handles with rule of thirds grid for composition.
- **Real-Time Preview** - See all edits applied instantly on the canvas.

#### Export
- **Export Modal** - Loading states, success confirmation, and Ko-fi support prompt.
- **High-Res Export** - Download full-resolution PNG or JPG files with original filename + "-nobg" suffix.

---

## Tech Stack

- **[Astro](https://astro.build)** - Static site framework with island architecture
- **[React 19](https://react.dev)** - Interactive UI components
- **[Transformers.js](https://huggingface.co/docs/transformers.js)** - Client-side ML inference
- **[RMBG-1.4](https://huggingface.co/briaai/RMBG-1.4)** - Background removal model by BRIA AI
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[Tailwind CSS v4](https://tailwindcss.com)** - Utility-first styling

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/clearcut.git
cd clearcut

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

### Commands

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Install dependencies                         |
| `npm run dev`     | Start dev server at `localhost:4321`         |
| `npm run build`   | Build production site to `./dist/`           |
| `npm run preview` | Preview production build locally             |

---

## Project Structure

```
clearcut/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── landing/              # Landing page components
│   │   ├── remove/               # Background removal & editing UI
│   │   │   ├── BackgroundRemover.tsx    # Main orchestrator
│   │   │   ├── UploadZone.tsx           # Image upload
│   │   │   ├── ProcessingState.tsx      # Loading states
│   │   │   ├── ResultsView.tsx          # Results display
│   │   │   ├── EditingView.tsx          # Brush editing view
│   │   │   ├── ComparisonSlider.tsx     # Before/after slider
│   │   │   ├── BrushPanel.tsx           # Brush controls
│   │   │   ├── BackgroundPanel.tsx      # Background controls
│   │   │   ├── EditModal.tsx            # Full-screen editor
│   │   │   ├── EditPreview.tsx          # Interactive canvas preview
│   │   │   ├── ExportModal.tsx          # Export flow with Ko-fi
│   │   │   ├── BackgroundSelector.tsx   # Preset/custom backgrounds
│   │   │   ├── FilterControls.tsx       # BG filter sliders
│   │   │   ├── TransformControls.tsx    # Zoom/rotate/flip/crop
│   │   │   ├── RefineEdgesModal.tsx     # Edge refinement overlay
│   │   │   ├── RefineEdgesCanvas.tsx    # Zoomable canvas with brush
│   │   │   └── RefineEdgesControls.tsx  # Refinement tool controls
│   │   └── ui/                   # Reusable UI components
│   ├── lib/
│   │   ├── segmentation.ts       # AI model integration
│   │   ├── compositing.ts        # Canvas rendering & export
│   │   ├── brushTool.ts          # Brush editing utilities
│   │   ├── imageFilters.ts       # CSS filter utilities
│   │   └── imageTransforms.ts    # Canvas transform utilities
│   ├── stores/
│   │   └── appStore.ts           # Zustand state management
│   ├── layouts/
│   │   └── Layout.astro          # Base HTML layout
│   ├── pages/
│   │   ├── index.astro           # Landing page
│   │   └── remove.astro          # Background removal tool
│   └── styles/
│       └── global.css            # Tailwind & global styles
├── astro.config.mjs
├── tailwind.config.js
└── package.json
```

---

## How It Works

1. **Model Loading** - On first visit, the RMBG-1.4 model (~45MB) is downloaded and cached in your browser.
2. **Image Processing** - When you upload an image, it's processed entirely client-side using WebGPU (if available) or WASM.
3. **Mask Generation** - The AI generates a segmentation mask identifying foreground vs background.
4. **Edge Refinement** - Use the Refine Edges tool to clean up any imperfections. Zoom in (up to 4x) for precision work, use Eraser to remove leftover background, or Restore to bring back accidentally removed details.
5. **Image Editing** - Open the full-screen editor to apply background replacements, filters (brightness, contrast, saturation, blur), transforms (zoom, rotate, flip), and crop to specific aspect ratios.
6. **Compositing** - The mask is applied to create a transparent background, with optional color/image replacement and filters.
7. **Export** - Click the download button to trigger the export modal. The final result is rendered to a canvas and exported as PNG/JPG with the original filename + "-nobg" suffix.

**No data ever leaves your browser.**

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [BRIA AI](https://bria.ai/) for the RMBG-1.4 background removal model
- [Hugging Face](https://huggingface.co/) for Transformers.js
- [Astro](https://astro.build/) for the amazing web framework

---

<p align="center">
  Made with care for your privacy
</p>
