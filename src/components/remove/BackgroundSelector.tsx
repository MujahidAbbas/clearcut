import { useRef, useState, useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';

const PRESET_BACKGROUNDS = [
  { id: 'transparent', label: 'None', value: null, type: 'transparent' },
  { id: 'white', label: 'White', value: '#ffffff', type: 'color' },
  { id: 'black', label: 'Black', value: '#000000', type: 'color' },
  { id: 'mist', label: 'Mist', value: '#e8e8e8', type: 'color' },
  { id: 'sky', label: 'Sky', value: '#87ceeb', type: 'color' },
  { id: 'honeydew', label: 'Honeydew', value: '#f0fff0', type: 'color' },
  { id: 'ivory', label: 'Ivory', value: '#fffff0', type: 'color' },
  { id: 'lavender', label: 'Lavender', value: '#e6e6fa', type: 'color' },
  { id: 'cyan', label: 'Cyan', value: '#e0ffff', type: 'color' },
  { id: 'mint', label: 'Mint', value: '#98ff98', type: 'color' },
  { id: 'peach', label: 'Peach', value: '#ffdab9', type: 'color' },
  { id: 'rose', label: 'Rose', value: '#ffe4e1', type: 'color' },
] as const;

export default function BackgroundSelector() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const backgroundType = useAppStore((state) => state.backgroundType);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const setBackgroundType = useAppStore((state) => state.setBackgroundType);
  const setBackgroundColor = useAppStore((state) => state.setBackgroundColor);
  const setBackgroundImage = useAppStore((state) => state.setBackgroundImage);
  const setHasUnsavedEdits = useAppStore((state) => state.setHasUnsavedEdits);

  // Initialize customColor from current backgroundColor if type is 'color'
  const [customColor, setCustomColor] = useState(
    backgroundType === 'color' ? backgroundColor : '#ffffff'
  );

  // Sync customColor when backgroundColor changes externally
  useEffect(() => {
    if (backgroundType === 'color') {
      setCustomColor(backgroundColor);
    }
  }, [backgroundColor, backgroundType]);

  function handlePresetClick(preset: (typeof PRESET_BACKGROUNDS)[number]) {
    if (preset.type === 'transparent') {
      setBackgroundType('transparent');
    } else {
      setBackgroundType('color');
      setBackgroundColor(preset.value!);
    }
    setHasUnsavedEdits(true);
  }

  function handleCustomColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const color = e.target.value;
    setCustomColor(color);
    setBackgroundType('color');
    setBackgroundColor(color);
    setHasUnsavedEdits(true);
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      setBackgroundType('image');
      setBackgroundImage(img);
      setHasUnsavedEdits(true);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      console.error('Failed to load background image');
    };
  }

  function isSelected(preset: (typeof PRESET_BACKGROUNDS)[number]): boolean {
    if (preset.type === 'transparent') {
      return backgroundType === 'transparent';
    }
    return backgroundType === 'color' && backgroundColor === preset.value;
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <h3 className="text-sm font-semibold text-gray-700">Background</h3>

      {/* Preset Swatches Grid */}
      <div className="grid grid-cols-6 gap-2">
        {PRESET_BACKGROUNDS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset)}
            className={`
              w-10 h-10 rounded-lg border-2 transition-all
              ${
                isSelected(preset)
                  ? 'border-blue-500 ring-2 ring-blue-500/30'
                  : 'border-gray-200 hover:border-gray-300'
              }
            `}
            style={
              preset.type === 'transparent'
                ? {
                    backgroundColor: '#fff',
                    backgroundImage: `
                      linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%),
                      linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)
                    `,
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 4px 4px',
                  }
                : { backgroundColor: preset.value || undefined }
            }
            aria-label={`${preset.label} background`}
            title={preset.label}
          />
        ))}
      </div>

      {/* Custom Color Row */}
      <div className="flex items-center gap-3">
        <label htmlFor="custom-color" className="text-sm text-gray-600">
          Custom Color
        </label>
        <input
          type="color"
          id="custom-color"
          value={customColor}
          onChange={handleCustomColorChange}
          className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
          aria-label="Select custom background color"
        />
      </div>

      {/* Photo Upload */}
      <div>
        <button
          onClick={handleUploadClick}
          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg
                     text-sm text-gray-600 hover:border-blue-500 hover:text-blue-500
                     transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Upload Photo Background
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
