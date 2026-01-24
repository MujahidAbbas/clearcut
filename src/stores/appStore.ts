import { create } from 'zustand';

// Types
export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
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
};

const initialState = {
  originalImage: null,
  maskCanvas: null,
  originalFileName: null,
  backgroundColor: '#ffffff',
  backgroundType: 'transparent' as const,
  backgroundImage: null,
  brushSize: 20,
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
}));
