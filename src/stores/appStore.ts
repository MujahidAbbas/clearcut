import { create } from 'zustand';

// Types
export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Refine Edges state for zoom/pan during mask refinement
export interface RefineEdgesState {
  zoom: number;           // 1.0 to 4.0, default 1.0
  pan: { x: number; y: number };  // Pan offset in pixels
  isSpacePressed: boolean; // Track if space key is held for panning
}

export interface EditState {
  rotation: number;        // degrees: 0, 90, 180, 270
  flipHorizontal: boolean;
  flipVertical: boolean;
  zoom: number;            // 0.5 to 3.0, default 1.0
  pan: { x: number; y: number };
  filters: {
    brightness: number;    // 0-200%, default 100
    contrast: number;      // 0-200%, default 100
    saturation: number;    // 0-200%, default 100
    blur: number;          // 0-20px, default 0
  };
  aspectRatio: 'original' | 'free' | '1:1' | '4:3' | '16:9' | '9:16';
  cropBox: CropBox | null; // null when no crop is active (original/free without user interaction)
  cropDisplayScale: number; // scale factor to convert cropBox display coords to actual image coords
}

interface AppState {
  // Image State
  originalImage: HTMLImageElement | null;
  maskCanvas: HTMLCanvasElement | null;
  originalFileName: string | null;

  // Background Settings
  backgroundColor: string;
  backgroundType: 'transparent' | 'color' | 'image';
  backgroundImage: HTMLImageElement | null;

  // Brush Settings
  brushSize: number;
  brushMode: 'erase' | 'restore';

  // UI State
  isProcessing: boolean;
  modelLoaded: boolean;
  modelProgress: number;
  sliderPosition: number;

  // History (for undo/redo)
  history: string[];
  historyIndex: number;

  // Edit State
  editState: EditState;
  isEditModalOpen: boolean;
  hasUnsavedEdits: boolean;

  // Refine Edges State
  isRefineModalOpen: boolean;
  refineEdgesState: RefineEdgesState;
  preRefineMaskSnapshot: string | null;  // Snapshot before refine session for "Reset All"

  // Actions
  setOriginalImage: (img: HTMLImageElement | null) => void;
  setMaskCanvas: (canvas: HTMLCanvasElement | null) => void;
  setOriginalFileName: (name: string | null) => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundType: (type: 'transparent' | 'color' | 'image') => void;
  setBackgroundImage: (img: HTMLImageElement | null) => void;
  setBrushSize: (size: number) => void;
  setBrushMode: (mode: 'erase' | 'restore') => void;
  setIsProcessing: (processing: boolean) => void;
  setModelLoaded: (loaded: boolean) => void;
  setModelProgress: (progress: number) => void;
  setSliderPosition: (position: number) => void;
  pushHistory: (snapshot: string) => void;
  undo: () => string | null;
  redo: () => string | null;
  reset: () => void;
  setEditState: (partial: Partial<EditState>) => void;
  resetEditState: () => void;
  openEditModal: () => void;
  closeEditModal: () => void;
  setHasUnsavedEdits: (value: boolean) => void;
  applyEdits: () => void;
  
  // Refine Edges Actions
  openRefineModal: (maskSnapshot: string) => void;
  closeRefineModal: () => void;
  setRefineZoom: (zoom: number) => void;
  setRefinePan: (pan: { x: number; y: number }) => void;
  setRefineSpacePressed: (pressed: boolean) => void;
  resetRefineEdgesState: () => void;
  getPreRefineMaskSnapshot: () => string | null;
}

const editInitialState: EditState = {
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  zoom: 1.0,
  pan: { x: 0, y: 0 },
  filters: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
  },
  aspectRatio: 'original',
  cropBox: null,
  cropDisplayScale: 1,
};

// Initial state for refine edges modal (zoom 1.0-4.0, pan with space+drag)
const refineEdgesInitialState: RefineEdgesState = {
  zoom: 1.0,
  pan: { x: 0, y: 0 },
  isSpacePressed: false,
};

const initialState = {
  originalImage: null,
  maskCanvas: null,
  originalFileName: null,
  backgroundColor: '#ffffff',
  backgroundType: 'transparent' as const,
  backgroundImage: null,
  brushSize: 30,  // Default 30px for refine edges (was 20)
  brushMode: 'erase' as const,
  isProcessing: false,
  modelLoaded: false,
  modelProgress: 0,
  sliderPosition: 50,
  history: [] as string[],
  historyIndex: -1,
  editState: editInitialState,
  isEditModalOpen: false,
  hasUnsavedEdits: false,
  // Refine Edges initial state
  isRefineModalOpen: false,
  refineEdgesState: refineEdgesInitialState,
  preRefineMaskSnapshot: null as string | null,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setOriginalImage: (img) => set({ originalImage: img }),
  setMaskCanvas: (canvas) => set({ maskCanvas: canvas }),
  setOriginalFileName: (name) => set({ originalFileName: name }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  setBackgroundType: (type) => set({ backgroundType: type }),
  setBackgroundImage: (img) => set({ backgroundImage: img }),
  setBrushSize: (size) => set({ brushSize: size }),
  setBrushMode: (mode) => set({ brushMode: mode }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  setModelLoaded: (loaded) => set({ modelLoaded: loaded }),
  setModelProgress: (progress) => set({ modelProgress: progress }),
  setSliderPosition: (position) => set({ sliderPosition: position }),

  pushHistory: (snapshot) => {
    const { history, historyIndex } = get();
    // Remove any future history if we're not at the end
    const newHistory = [...history.slice(0, historyIndex + 1), snapshot];
    // Limit history to 20 entries to prevent memory issues
    if (newHistory.length > 20) {
      newHistory.shift();
    }
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return null;
    const newIndex = historyIndex - 1;
    set({ historyIndex: newIndex });
    return history[newIndex];
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return null;
    const newIndex = historyIndex + 1;
    set({ historyIndex: newIndex });
    return history[newIndex];
  },

  reset: () => set(initialState),

  setEditState: (partial) => set((state) => ({
    editState: { ...state.editState, ...partial },
    hasUnsavedEdits: true,
  })),

  resetEditState: () => set({
    editState: editInitialState,
    hasUnsavedEdits: false,
  }),

  openEditModal: () => set({ isEditModalOpen: true }),

  closeEditModal: () => set({ isEditModalOpen: false }),

  setHasUnsavedEdits: (value) => set({ hasUnsavedEdits: value }),

  applyEdits: () => set({
    hasUnsavedEdits: false,
    isEditModalOpen: false,
  }),

  // Refine Edges Actions - Opens modal and saves current mask state for potential reset
  openRefineModal: (maskSnapshot: string) => set({
    isRefineModalOpen: true,
    preRefineMaskSnapshot: maskSnapshot,
    refineEdgesState: refineEdgesInitialState,  // Reset zoom/pan when opening
  }),

  // Closes refine modal and clears the pre-refine snapshot
  closeRefineModal: () => set({
    isRefineModalOpen: false,
    refineEdgesState: refineEdgesInitialState,
  }),

  // Sets zoom level for refine edges canvas (clamped to 1.0-4.0)
  setRefineZoom: (zoom: number) => set((state) => ({
    refineEdgesState: {
      ...state.refineEdgesState,
      zoom: Math.max(1.0, Math.min(4.0, zoom)),
    },
  })),

  // Sets pan offset for refine edges canvas
  setRefinePan: (pan: { x: number; y: number }) => set((state) => ({
    refineEdgesState: {
      ...state.refineEdgesState,
      pan,
    },
  })),

  // Tracks space key press state for pan mode
  setRefineSpacePressed: (pressed: boolean) => set((state) => ({
    refineEdgesState: {
      ...state.refineEdgesState,
      isSpacePressed: pressed,
    },
  })),

  // Resets refine edges state (zoom, pan) to defaults
  resetRefineEdgesState: () => set({
    refineEdgesState: refineEdgesInitialState,
  }),

  // Returns the mask snapshot saved when refine modal opened (for "Reset All Edits")
  getPreRefineMaskSnapshot: () => get().preRefineMaskSnapshot,
}));
