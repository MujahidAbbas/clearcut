import { create } from 'zustand';

// Types
interface AppState {
  // Image State
  originalImage: HTMLImageElement | null;
  maskCanvas: HTMLCanvasElement | null;

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

  // Actions
  setOriginalImage: (img: HTMLImageElement | null) => void;
  setMaskCanvas: (canvas: HTMLCanvasElement | null) => void;
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
}

const initialState = {
  originalImage: null,
  maskCanvas: null,
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
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setOriginalImage: (img) => set({ originalImage: img }),
  setMaskCanvas: (canvas) => set({ maskCanvas: canvas }),
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
}));
