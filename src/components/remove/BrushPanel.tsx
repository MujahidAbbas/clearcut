import { useAppStore } from '../../stores/appStore';

interface BrushPanelProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function BrushPanel({ onUndo, onRedo, canUndo, canRedo }: BrushPanelProps) {
  const { brushSize, setBrushSize, brushMode, setBrushMode } = useAppStore();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <h3 className="font-semibold text-sm text-gray-700">Brush Tool</h3>

      {/* Mode Toggle */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500 uppercase tracking-wide">Mode</label>
        <div className="flex gap-2">
          <button
            onClick={() => setBrushMode('erase')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              brushMode === 'erase'
                ? 'bg-red-100 text-red-700 border-2 border-red-300'
                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
            }`}
          >
            <span className="mr-1">✂️</span> Erase
          </button>
          <button
            onClick={() => setBrushMode('restore')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              brushMode === 'restore'
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
            }`}
          >
            <span className="mr-1">🖌️</span> Restore
          </button>
        </div>
      </div>

      {/* Brush Size */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs text-gray-500 uppercase tracking-wide">Brush Size</label>
          <span className="text-sm text-gray-700 font-medium">{brushSize}px</span>
        </div>
        <input
          type="range"
          min="5"
          max="100"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>5px</span>
          <span>100px</span>
        </div>
      </div>

      {/* Undo/Redo */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ↶ Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ↷ Redo
        </button>
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
        {brushMode === 'erase'
          ? 'Click and drag to remove parts of the subject'
          : 'Click and drag to restore parts of the subject'}
      </p>
    </div>
  );
}
