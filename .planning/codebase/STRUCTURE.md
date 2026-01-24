# Codebase Structure

**Analysis Date:** 2026-01-24

## Directory Layout

```
clearcut/
├── src/
│   ├── components/
│   │   ├── landing/          # Landing page components
│   │   │   ├── BeforeAfterSlider.tsx
│   │   │   ├── FeatureCard.tsx
│   │   │   ├── FeaturesGrid.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Hero.tsx
│   │   ├── remove/           # Background removal tool UI
│   │   │   ├── BackgroundPanel.tsx
│   │   │   ├── BackgroundRemover.tsx    # Main orchestrator component
│   │   │   ├── BrushPanel.tsx
│   │   │   ├── ComparisonSlider.tsx
│   │   │   ├── EditingView.tsx
│   │   │   ├── ProcessingState.tsx
│   │   │   ├── ResultsView.tsx
│   │   │   └── UploadZone.tsx
│   │   └── ui/               # Reusable UI primitives
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Container.tsx
│   │       └── Spinner.tsx
│   ├── lib/                  # Business logic & processing
│   │   ├── segmentation.ts   # RMBG-1.4 model pipeline (singleton)
│   │   ├── compositing.ts    # Canvas rendering & export
│   │   └── brushTool.ts      # Mask refinement operations
│   ├── stores/               # State management
│   │   └── appStore.ts       # Zustand store (image, mask, UI state)
│   ├── pages/                # Astro file routes
│   │   ├── index.astro       # Landing page (/)
│   │   ├── remove.astro      # Removal tool (/remove)
│   │   ├── privacy.astro     # Privacy policy
│   │   └── terms.astro       # Terms of service
│   ├── layouts/
│   │   └── Layout.astro      # Base HTML layout with Vercel analytics
│   └── styles/
│       └── global.css        # TailwindCSS imports
├── public/
│   ├── demo-before.jpg
│   ├── demo-after.png
│   └── favicon.svg
├── package.json
├── tsconfig.json
├── astro.config.mjs
└── tailwind.config.mjs
```

## Directory Purposes

**src/components/landing/:**
- Purpose: Homepage and marketing components
- Contains: Hero section, before/after demo slider, feature cards, header navigation, footer
- Key files: `Hero.tsx` renders headline/CTA, `BeforeAfterSlider.tsx` shows processed image example
- All use `client:visible` or `client:load` directives to hydrate on demand

**src/components/remove/:**
- Purpose: Background removal tool UI
- Contains: Upload interface, processing indicator, results view with comparison slider, mask editing interface
- Key files:
  - `BackgroundRemover.tsx`: Main component that orchestrates the 4 view states
  - `EditingView.tsx`: Canvas-based brush editing with undo/redo
  - `ResultsView.tsx`: Comparison slider and download button
  - `UploadZone.tsx`: Drag-drop file upload interface
- Uses `client:only="react"` because Transformers.js requires browser APIs

**src/components/ui/:**
- Purpose: Reusable design system components
- Contains: Button variants (primary, secondary), Badge, Container, Spinner
- Pattern: Props-based styling with TailwindCSS classes
- Used by: Landing and remove components for consistent UI

**src/lib/:**
- Purpose: Core business logic independent of React
- Contains:
  - `segmentation.ts`: Transformers.js pipeline wrapper (singleton pattern, lazy init)
  - `compositing.ts`: Canvas 2D rendering API wrappers (layering, export)
  - `brushTool.ts`: Canvas stroke operations (erase/restore modes, cursor styling)
- All functions are pure or have side effects only on canvas/HTML
- No imports from React or stores

**src/stores/:**
- Purpose: Centralized application state
- Location: `appStore.ts` only
- Contains: Zustand store with 14 state properties, 13+ actions
- Pattern: Use hook pattern via `useAppStore()` in React components

**src/pages/:**
- Purpose: Route definitions via Astro file-based routing
- Contains:
  - `index.astro`: Landing page
  - `remove.astro`: Background removal tool page
  - `privacy.astro`: Privacy policy page
  - `terms.astro`: Terms of service page
- Pattern: Astro files with frontmatter imports + HTML template
- Directives: `client:load` (eager hydration) and `client:only="react"` (browser-only)

**src/layouts/:**
- Purpose: Shared page template and head configuration
- Key file: `Layout.astro` defines HTML structure, fonts, Vercel analytics
- Used by: All page files via `<Layout title="...">` wrapper

**src/styles/:**
- Purpose: Global stylesheet
- Key file: `global.css` imports TailwindCSS and base styles
- Pattern: TailwindCSS utility classes used throughout components

## Key File Locations

**Entry Points:**
- `src/pages/index.astro`: Landing page entry point
- `src/pages/remove.astro`: Removal tool entry point
- `src/components/remove/BackgroundRemover.tsx`: Main component initialization

**Configuration:**
- `tsconfig.json`: TypeScript config with path alias `@/*` → `src/*`
- `astro.config.mjs`: Astro build configuration
- `tailwind.config.mjs`: Tailwind CSS configuration
- `package.json`: Dependencies and build scripts

**Core Logic:**
- `src/lib/segmentation.ts`: ML model pipeline
- `src/lib/compositing.ts`: Image rendering
- `src/lib/brushTool.ts`: Mask editing

**State:**
- `src/stores/appStore.ts`: Zustand store (single source of truth)

**Testing:**
- No test files present (testing analysis: see TESTING.md)

## Naming Conventions

**Files:**
- React components: PascalCase `.tsx` (e.g., `BackgroundRemover.tsx`, `UploadZone.tsx`)
- Utilities & libraries: camelCase `.ts` (e.g., `appStore.ts`, `brushTool.ts`)
- Astro pages & layouts: PascalCase `.astro` (e.g., `Layout.astro`) or lowercase routes (e.g., `index.astro`, `remove.astro`)
- Styles: lowercase `.css` (e.g., `global.css`)

**Directories:**
- Feature-based grouping: `landing/`, `remove/` under components
- Functional grouping: `lib/`, `stores/`, `pages/`, `layouts/`
- UI primitives in `ui/` subdirectory

**Functions:**
- Action functions (state updates): camelCase `setOriginalImage`, `pushHistory`
- Utility functions (business logic): camelCase `removeBackground`, `renderComposite`, `drawBrushLine`
- React component functions: PascalCase function name matching filename
- Hooks: camelCase starting with `use` (e.g., `useAppStore` from Zustand)

**Types:**
- Component props interfaces: PascalCase ending with `Props` (e.g., `ResultsViewProps`, `EditingViewProps`)
- Data interfaces: PascalCase (e.g., `AppState`, `Background`, `BrushStroke`)
- View state: lowercase literals in union type (e.g., `'upload' | 'processing' | 'result' | 'editing'`)

## Where to Add New Code

**New Feature (e.g., image filters, batch processing):**
- Primary code: `src/lib/` (create `newFeature.ts` if processing-heavy, or add to existing `*.ts` file)
- Component: `src/components/remove/` (create `NewFeaturePanel.tsx` for UI)
- State: Add new properties to `src/stores/appStore.ts` if needed
- Tests: `src/__tests__/` (create if doesn't exist)

**New Component/Module:**
- UI Component: `src/components/{landing,remove,ui}/` depending on purpose
- Implementation: Always co-locate component file with its logic
- Pattern: Export default function named after file, define interfaces in same file if small

**Utilities & Helpers:**
- Processing logic: `src/lib/` (one file per functional area)
- UI utilities: `src/components/ui/` if reusable across multiple components
- Store helpers: Add as actions inside `appStore.ts` or as utility functions in `src/lib/`

**Styling:**
- TailwindCSS utility classes: Inline in JSX templates (preferred)
- Global styles: `src/styles/global.css` for resets, base styles, custom utilities
- Component-scoped styles: CSS modules not used; Tailwind utility-first approach

## Special Directories

**public/:**
- Purpose: Static assets served directly by Astro
- Generated: No
- Committed: Yes
- Contains: Demo images (before/after), favicon

**dist/:**
- Purpose: Production build output
- Generated: Yes (via `npm run build`)
- Committed: No
- Contains: Compiled HTML, CSS, JavaScript

**.astro/**
- Purpose: Astro type definitions and metadata
- Generated: Yes (via Astro during dev/build)
- Committed: No
- Pattern: TypeScript references and framework internals

**node_modules/:**
- Purpose: Installed dependencies
- Generated: Yes (via `npm install`)
- Committed: No
- Pattern: Contains Transformers.js, Astro, React, Zustand, TailwindCSS

## Import Paths & Aliases

**Path Alias Configuration (tsconfig.json):**
```json
{
  "paths": {
    "@/*": ["src/*"]
  }
}
```

**Usage Examples:**
```typescript
// Instead of: ../../lib/segmentation
import { removeBackground } from '@/lib/segmentation';

// Instead of: ../../stores/appStore
import { useAppStore } from '@/stores/appStore';

// Instead of: ../ui/Button
import Button from '@/components/ui/Button';
```

All imports within `src/` should use `@/` alias for clarity and maintainability.

## Development Workflow

**Start Development:**
```bash
npm run dev  # Starts Astro dev server at localhost:4321
```

**Build Production:**
```bash
npm run build  # Compiles to ./dist/
npm run preview  # Serves production build locally
```

**File Watching:** Astro automatically reloads on file changes in dev mode.

**Hot Module Replacement:** React components hydrate and re-render on save (for client-side components).
