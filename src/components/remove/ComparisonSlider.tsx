import { useRef, useCallback, useEffect } from 'react';

interface ComparisonSliderProps {
  originalImage: HTMLImageElement;
  previewCanvas: HTMLCanvasElement;
  previewVersion: number;
  sliderPosition: number;
  onSliderChange: (position: number) => void;
}

export default function ComparisonSlider({
  originalImage,
  previewCanvas,
  previewVersion,
  sliderPosition,
  onSliderChange,
}: ComparisonSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  // Draw original image to canvas
  useEffect(() => {
    if (!originalCanvasRef.current || !originalImage) return;
    const ctx = originalCanvasRef.current.getContext('2d');
    if (!ctx) return;

    originalCanvasRef.current.width = originalImage.naturalWidth;
    originalCanvasRef.current.height = originalImage.naturalHeight;
    ctx.drawImage(originalImage, 0, 0);
  }, [originalImage]);

  // Draw preview canvas content - re-runs when previewVersion changes
  useEffect(() => {
    if (!processedCanvasRef.current || !previewCanvas) return;
    const ctx = processedCanvasRef.current.getContext('2d');
    if (!ctx) return;

    processedCanvasRef.current.width = previewCanvas.width;
    processedCanvasRef.current.height = previewCanvas.height;
    ctx.drawImage(previewCanvas, 0, 0);
  }, [previewCanvas, previewVersion]);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    onSliderChange(percentage);
  }, [onSliderChange]);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  // Calculate aspect ratio for container
  const aspectRatio = originalImage.naturalWidth / originalImage.naturalHeight;

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl overflow-hidden select-none"
      style={{ aspectRatio }}
      onMouseDown={handleMouseDown}
      onTouchMove={handleTouchMove}
    >
      {/* Checkerboard background */}
      <div className="absolute inset-0 checkerboard" />

      {/* Processed image (full) */}
      <canvas
        ref={processedCanvasRef}
        className="absolute inset-0 w-full h-full object-contain"
      />

      {/* Original image (clipped) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <canvas
          ref={originalCanvasRef}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Slider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-lg pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      />

      {/* Slider handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full border-2 border-primary shadow-lg flex items-center justify-center cursor-ew-resize hover:scale-110 transition-transform z-10"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
      >
        <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5l-5 7 5 7V5zm8 0v14l5-7-5-7z" />
        </svg>
      </div>
    </div>
  );
}
