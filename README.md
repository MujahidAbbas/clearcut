# Clearcut

**Free, unlimited, and 100% private AI background removal - right in your browser.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Built with Astro](https://img.shields.io/badge/Built%20with-Astro-FF5D01.svg)](https://astro.build)
[![Powered by Transformers.js](https://img.shields.io/badge/Powered%20by-Transformers.js-FFD21E.svg)](https://huggingface.co/docs/transformers.js)

---

## Overview

Clearcut is a privacy-first background removal tool that runs entirely in your browser. No uploads, no servers, no subscriptions - just instant, studio-quality results powered by AI.

### Key Features

- **100% Private** - Your images never leave your device. All processing happens locally in your browser.
- **Unlimited & Free** - No usage limits, no watermarks, no accounts required.
- **Instant Processing** - Powered by WebGPU/WASM for fast inference.
- **Studio-Grade Quality** - Uses the RMBG-1.4 model for precise edge detection and hair handling.
- **Brush Editing** - Fine-tune results with erase/restore brush tools.
- **Background Replacement** - Add solid colors or custom images as backgrounds.
- **High-Res Export** - Download full-resolution PNG or JPG files.

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
│   │   ├── landing/        # Landing page components
│   │   ├── remove/         # Background removal UI
│   │   └── ui/             # Reusable UI components
│   ├── lib/
│   │   ├── segmentation.ts # AI model integration
│   │   ├── compositing.ts  # Canvas rendering & export
│   │   └── brushTool.ts    # Brush editing utilities
│   ├── stores/
│   │   └── appStore.ts     # Zustand state management
│   ├── layouts/
│   │   └── Layout.astro    # Base HTML layout
│   ├── pages/
│   │   ├── index.astro     # Landing page
│   │   └── remove.astro    # Background removal tool
│   └── styles/
│       └── global.css      # Tailwind & global styles
├── astro.config.mjs
├── tailwind.config.js
└── package.json
```

---

## How It Works

1. **Model Loading** - On first visit, the RMBG-1.4 model (~45MB) is downloaded and cached in your browser.
2. **Image Processing** - When you upload an image, it's processed entirely client-side using WebGPU (if available) or WASM.
3. **Mask Generation** - The AI generates a segmentation mask identifying foreground vs background.
4. **Compositing** - The mask is applied to create a transparent background, with optional color/image replacement.
5. **Export** - The final result is rendered to a canvas and exported as PNG/JPG.

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
