import { useAppStore } from '@/stores/appStore';

const ASPECT_RATIOS = [
  { id: 'original', label: 'Original' },
  { id: 'free', label: 'Free' },
  { id: '1:1', label: '1:1' },
  { id: '4:3', label: '4:3' },
  { id: '16:9', label: '16:9' },
  { id: '9:16', label: '9:16' },
] as const;

// Icon components
function RotateLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function RotateRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

function FlipHorizontalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3" />
      <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
      <path d="M12 20v-16" />
    </svg>
  );
}

function FlipVerticalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
      <path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" />
      <path d="M4 12h16" />
    </svg>
  );
}

export default function TransformControls() {
  const editState = useAppStore((state) => state.editState);
  const setEditState = useAppStore((state) => state.setEditState);
  const setHasUnsavedEdits = useAppStore((state) => state.setHasUnsavedEdits);

  const { rotation, flipHorizontal, flipVertical, aspectRatio, zoom } = editState;

  function handleZoomChange(value: number) {
    setEditState({ zoom: value });
    setHasUnsavedEdits(true);
  }

  function handleRotate(degrees: number) {
    // Normalize to 0, 90, 180, 270
    const newRotation = ((rotation + degrees) % 360 + 360) % 360;
    setEditState({ rotation: newRotation });
    setHasUnsavedEdits(true);
  }

  function handleFlipHorizontal() {
    setEditState({ flipHorizontal: !flipHorizontal });
    setHasUnsavedEdits(true);
  }

  function handleFlipVertical() {
    setEditState({ flipVertical: !flipVertical });
    setHasUnsavedEdits(true);
  }

  function handleAspectRatioChange(ratio: typeof ASPECT_RATIOS[number]['id']) {
    setEditState({ aspectRatio: ratio });
    setHasUnsavedEdits(true);
  }

  return (
    <div className="space-y-6">
      {/* Zoom Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Zoom</h3>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Level</span>
            <span className="text-xs text-gray-500 tabular-nums">{zoom.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            id="zoom-slider"
            min={0.5}
            max={3.0}
            step={0.1}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>0.5x</span>
            <span>1.0x</span>
            <span>3.0x</span>
          </div>
        </div>
      </div>

      {/* Transform Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Transform</h3>
        <div className="flex items-center gap-2">
          {/* Rotate Left */}
          <button
            onClick={() => handleRotate(-90)}
            className="flex-1 p-2 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
            aria-label="Rotate left 90 degrees"
            title="Rotate Left"
          >
            <RotateLeftIcon className="w-5 h-5 mx-auto text-gray-600" />
          </button>

          {/* Rotate Right */}
          <button
            onClick={() => handleRotate(90)}
            className="flex-1 p-2 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
            aria-label="Rotate right 90 degrees"
            title="Rotate Right"
          >
            <RotateRightIcon className="w-5 h-5 mx-auto text-gray-600" />
          </button>

          {/* Flip Horizontal */}
          <button
            onClick={handleFlipHorizontal}
            className={`flex-1 p-2 rounded-lg border transition-colors
              ${flipHorizontal
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-200 hover:border-primary hover:bg-primary/5 text-gray-600'
              }`}
            aria-label="Flip horizontal"
            aria-pressed={flipHorizontal}
            title="Flip Horizontal"
          >
            <FlipHorizontalIcon className="w-5 h-5 mx-auto" />
          </button>

          {/* Flip Vertical */}
          <button
            onClick={handleFlipVertical}
            className={`flex-1 p-2 rounded-lg border transition-colors
              ${flipVertical
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-200 hover:border-primary hover:bg-primary/5 text-gray-600'
              }`}
            aria-label="Flip vertical"
            aria-pressed={flipVertical}
            title="Flip Vertical"
          >
            <FlipVerticalIcon className="w-5 h-5 mx-auto" />
          </button>
        </div>
      </div>

      {/* Aspect Ratio Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Aspect Ratio</h3>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.id}
              onClick={() => handleAspectRatioChange(ratio.id)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors
                ${aspectRatio === ratio.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              aria-pressed={aspectRatio === ratio.id}
            >
              {ratio.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
