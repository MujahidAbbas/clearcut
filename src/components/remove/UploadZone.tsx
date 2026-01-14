import { useState, useRef, useCallback } from 'react';

interface UploadZoneProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
}

export default function UploadZone({ onImageSelect, disabled }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
  }, [disabled, onImageSelect]);

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        w-full max-w-xl mx-auto aspect-[4/3] rounded-2xl border-3 border-dashed
        flex flex-col items-center justify-center cursor-pointer
        transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isDragOver
          ? 'border-primary bg-primary/5 scale-[1.02]'
          : 'border-gray-300 bg-gray-50 hover:border-primary hover:bg-primary/5'
        }
      `}
    >
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-primary-light flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>

      {/* Text */}
      <h3 className="text-xl font-semibold mb-2">Drop your image here</h3>
      <p className="text-gray-text">Transparent background in seconds.</p>
    </div>
  );
}
