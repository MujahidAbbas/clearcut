/**
 * RefineEdgesControls.tsx
 * 
 * Control panel for the Refine Edges modal.
 * Contains tool selection, brush size, zoom controls, and reset button.
 * 
 * Tool Types:
 * - Eraser: Remove leftover background artifacts
 * - Restore: Bring back accidentally removed details
 * 
 * Controls:
 * - Brush Size slider (5-100px, default 30px)
 * - Zoom slider (1.0x-4.0x, default 1.0x)
 * - Reset All Edits button
 * 
 * Includes instructional callout for user guidance.
 */

import { useAppStore } from '@/stores/appStore';

interface RefineEdgesControlsProps {
  onResetAllEdits: () => void;
}

export default function RefineEdgesControls({ onResetAllEdits }: RefineEdgesControlsProps) {
  // Store state
  const brushSize = useAppStore((state) => state.brushSize);
  const setBrushSize = useAppStore((state) => state.setBrushSize);
  const brushMode = useAppStore((state) => state.brushMode);
  const setBrushMode = useAppStore((state) => state.setBrushMode);
  const refineEdgesState = useAppStore((state) => state.refineEdgesState);
  const setRefineZoom = useAppStore((state) => state.setRefineZoom);
  const resetRefineEdgesState = useAppStore((state) => state.resetRefineEdgesState);
  
  const { zoom } = refineEdgesState;

  // Handle zoom slider change
  const handleZoomChange = (value: number) => {
    setRefineZoom(value);
  };

  // Handle reset zoom/pan
  const handleResetView = () => {
    resetRefineEdgesState();
  };

  return (
    <div className="space-y-6">
      {/* Tool Type Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Tool Type</h3>
        <div className="flex gap-2">
          {/* Eraser Button */}
          <button
            onClick={() => setBrushMode('erase')}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center gap-1.5 ${
              brushMode === 'erase'
                ? 'bg-red-100 text-red-700 border-2 border-red-300 shadow-sm'
                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
            }`}
            aria-pressed={brushMode === 'erase'}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 20H9L4 15C3.5 14.5 3.5 13.5 4 13L13 4C13.5 3.5 14.5 3.5 15 4L21 10C21.5 10.5 21.5 11.5 21 12L12 20" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 15L15 6" strokeLinecap="round" />
            </svg>
            Eraser
          </button>
          
          {/* Restore Button */}
          <button
            onClick={() => setBrushMode('restore')}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center gap-1.5 ${
              brushMode === 'restore'
                ? 'bg-green-100 text-green-700 border-2 border-green-300 shadow-sm'
                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
            }`}
            aria-pressed={brushMode === 'restore'}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19L19 12L22 15L15 22L12 19Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 13L16.5 5.5L2 2L5.5 16.5L13 18L18 13Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 2L9.586 9.586" strokeLinecap="round" />
              <circle cx="11" cy="11" r="2" />
            </svg>
            Restore
          </button>
        </div>
      </div>

      {/* Brush Size Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700">Brush Size</h3>
          <span className="text-sm text-gray-500 font-medium tabular-nums">{brushSize}px</span>
        </div>
        <input
          type="range"
          min="5"
          max="100"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          aria-label="Brush size"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>5px</span>
          <span>100px</span>
        </div>
      </div>

      {/* Zoom Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700">Zoom</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium tabular-nums">{zoom.toFixed(1)}x</span>
            {zoom > 1 && (
              <button
                onClick={handleResetView}
                className="px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Reset zoom"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        <input
          type="range"
          min="1"
          max="4"
          step="0.1"
          value={zoom}
          onChange={(e) => handleZoomChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          aria-label="Zoom level"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>1.0x</span>
          <span>4.0x</span>
        </div>
      </div>

      {/* Reset All Edits Button */}
      <div className="pt-2">
        <button
          onClick={onResetAllEdits}
          className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Reset All Edits
        </button>
      </div>

      {/* Instructional Callout */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" strokeLinecap="round" />
              <path d="M12 8h.01" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Tip</p>
            <p className="text-amber-700">
              Use the <span className="font-semibold text-red-600">Eraser</span> to remove leftover background and{' '}
              <span className="font-semibold text-green-600">Restore</span> to bring back accidentally removed details.
            </p>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-gray-100">
        <p className="font-medium text-gray-500 mb-2">Keyboard shortcuts:</p>
        <div className="flex justify-between">
          <span>Pan view</span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">Space + Drag</kbd>
        </div>
        <div className="flex justify-between">
          <span>Zoom</span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">Ctrl + Scroll</kbd>
        </div>
        <div className="flex justify-between">
          <span>Close</span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">Esc</kbd>
        </div>
      </div>
    </div>
  );
}
