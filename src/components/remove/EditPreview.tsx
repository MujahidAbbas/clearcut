import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { applyTransforms } from '@/lib/imageTransforms';
import { applyFilter, resetFilter } from '@/lib/imageFilters';
import { drawMaskedForeground, drawCheckerboard } from '@/lib/compositing';

interface EditPreviewProps {
  originalImage: HTMLImageElement;
  maskCanvas: HTMLCanvasElement;
  showBefore?: boolean;
}

export default function EditPreview({
  originalImage,
  maskCanvas,
  showBefore = false,
}: EditPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number } | null>(null);

  // Store state
  const editState = useAppStore((state) => state.editState);
  const setEditState = useAppStore((state) => state.setEditState);
  const backgroundType = useAppStore((state) => state.backgroundType);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const backgroundImage = useAppStore((state) => state.backgroundImage);

  // Render preview
  const renderPreview = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // 1. Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If showing before, just draw the original image
    if (showBefore) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Center the original image
      const scale = Math.min(
        canvas.width / originalImage.width,
        canvas.height / originalImage.height
      );
      const scaledWidth = originalImage.width * scale;
      const scaledHeight = originalImage.height * scale;
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;

      ctx.drawImage(originalImage, x, y, scaledWidth, scaledHeight);
      ctx.restore();
      return;
    }

    // 2. Draw checkerboard if transparent
    if (backgroundType === 'transparent') {
      drawCheckerboard(ctx, canvas.width, canvas.height);
    }

    // 3. Save state
    ctx.save();

    // 4. Set high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 5. Apply transforms (zoom, pan, rotation, flip)
    applyTransforms(ctx, {
      rotation: editState.rotation,
      flipHorizontal: editState.flipHorizontal,
      flipVertical: editState.flipVertical,
      zoom: editState.zoom,
      pan: editState.pan
    }, canvas.width, canvas.height);

    // 6. Apply filters
    applyFilter(ctx, editState.filters);

    // 7. Draw background (if color or image)
    if (backgroundType === 'color') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (backgroundType === 'image' && backgroundImage) {
      // Cover background
      const scale = Math.max(
        canvas.width / backgroundImage.width,
        canvas.height / backgroundImage.height
      );
      const scaledWidth = backgroundImage.width * scale;
      const scaledHeight = backgroundImage.height * scale;
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;
      ctx.drawImage(backgroundImage, x, y, scaledWidth, scaledHeight);
    }

    // 8. Draw masked foreground
    drawMaskedForeground(ctx, originalImage, maskCanvas);

    // 9. Reset filter and restore state
    resetFilter(ctx);
    ctx.restore();
  };

  // Re-render when state changes
  useEffect(() => {
    renderPreview();
  }, [editState, backgroundType, backgroundColor, backgroundImage, showBefore]);

  // Initialize canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size based on original image or viewport
    const containerWidth = canvas.parentElement?.clientWidth || 800;
    const containerHeight = canvas.parentElement?.clientHeight || 600;

    // Calculate dimensions maintaining aspect ratio
    const aspectRatio = originalImage.width / originalImage.height;
    let width = containerWidth;
    let height = width / aspectRatio;

    if (height > containerHeight) {
      height = containerHeight;
      width = height * aspectRatio;
    }

    canvas.width = width;
    canvas.height = height;

    renderPreview();
  }, [originalImage]);

  // Wheel handler (zoom toward cursor)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3.0, editState.zoom * zoomFactor));

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Adjust pan to zoom toward cursor
    const dx = mouseX - canvas.width / 2 - editState.pan.x;
    const dy = mouseY - canvas.height / 2 - editState.pan.y;
    const zoomRatio = newZoom / editState.zoom;

    setEditState({
      zoom: newZoom,
      pan: {
        x: editState.pan.x - dx * (zoomRatio - 1),
        y: editState.pan.y - dy * (zoomRatio - 1)
      }
    });
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !lastMousePos) return;

    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    setEditState({
      pan: {
        x: editState.pan.x + deltaX,
        y: editState.pan.y + deltaY
      }
    });

    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastMousePos(null);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setLastMousePos(null);
  };

  return (
    <div className="relative w-full h-full bg-gray-900 flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
