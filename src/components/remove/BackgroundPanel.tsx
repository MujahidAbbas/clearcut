import { useRef } from 'react';
import { useAppStore } from '../../stores/appStore';

const presetColors = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#FF4444' },
  { name: 'Green', value: '#44FF44' },
  { name: 'Blue', value: '#4444FF' },
  { name: 'Yellow', value: '#FFFF44' },
];

export default function BackgroundPanel() {
  const {
    backgroundType,
    setBackgroundType,
    backgroundColor,
    setBackgroundColor,
    setBackgroundImage,
  } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      setBackgroundImage(img);
      setBackgroundType('image');
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <h3 className="font-semibold text-sm text-gray-700">Background</h3>

      {/* Background Type */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500 uppercase tracking-wide">Type</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setBackgroundType('transparent')}
            className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
              backgroundType === 'transparent'
                ? 'bg-primary-light text-primary border-2 border-primary'
                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
            }`}
          >
            <div className="w-6 h-6 mx-auto mb-1 rounded checkerboard border border-gray-300" />
            None
          </button>
          <button
            onClick={() => setBackgroundType('color')}
            className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
              backgroundType === 'color'
                ? 'bg-primary-light text-primary border-2 border-primary'
                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
            }`}
          >
            <div
              className="w-6 h-6 mx-auto mb-1 rounded border border-gray-300"
              style={{ backgroundColor }}
            />
            Color
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
              backgroundType === 'image'
                ? 'bg-primary-light text-primary border-2 border-primary'
                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
            }`}
          >
            <div className="w-6 h-6 mx-auto mb-1 rounded bg-gray-300 flex items-center justify-center text-gray-500">
              🖼️
            </div>
            Image
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Color Picker (shown when color type is selected) */}
      {backgroundType === 'color' && (
        <div className="space-y-2">
          <label className="text-xs text-gray-500 uppercase tracking-wide">Color</label>

          {/* Preset Colors */}
          <div className="flex gap-2 flex-wrap">
            {presetColors.map((color) => (
              <button
                key={color.value}
                onClick={() => setBackgroundColor(color.value)}
                className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                  backgroundColor === color.value
                    ? 'border-primary ring-2 ring-primary ring-offset-1'
                    : 'border-gray-300'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>

          {/* Custom Color Picker */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border border-gray-300"
            />
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="#FFFFFF"
            />
          </div>
        </div>
      )}
    </div>
  );
}
