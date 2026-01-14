import { useRef, useCallback, useEffect, useState } from 'react';
import Button from '../ui/Button';
import BrushPanel from './BrushPanel';
import BackgroundPanel from './BackgroundPanel';
import { downloadCanvas, createExportCanvas, renderComposite } from '../../lib/compositing';
import { getCanvasCoords, drawBrushLine, saveMaskSnapshot, restoreMaskSnapshot } from '../../lib/brushTool';
import { useAppStore } from '../../stores/appStore';

interface EditingViewProps {
  originalImage: HTMLImageElement;
  maskCanvas: HTMLCanvasElement;
  onBack: () => void;
  onReset: () => void;
}

export default function EditingView({
  originalImage,
  maskCanvas,
  onBack,
  onReset,
}: EditingViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const {
    brushSize,
    brushMode,
    backgroundType,
    backgroundColor,
    backgroundImage,
    history,
    historyIndex,
    pushHistory,
    undo,
    redo,
  } = useAppStore();

  const [, forceUpdate] = useState(0);

  // Redraw canvas when mask or background changes
  const redraw = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = originalImage.naturalWidth;
    canvasRef.current.height = originalImage.naturalHeight;

    renderComposite(ctx, originalImage, maskCanvas, {
      type: backgroundType,
      color: backgroundColor,
      image: backgroundImage ?? undefined,
    });
  }, [originalImage, maskCanvas, backgroundType, backgroundColor, backgroundImage]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    isDrawing.current = true;
    const coords = getCanvasCoords(e.nativeEvent, canvasRef.current);
    lastPos.current = { x: coords.x, y: coords.y };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !canvasRef.current || !lastPos.current) return;

    const coords = getCanvasCoords(e.nativeEvent, canvasRef.current);
    const currentPos = { x: coords.x, y: coords.y };

    // Draw on mask
    drawBrushLine(maskCanvas, lastPos.current, currentPos, brushSize, brushMode, coords.scale);

    // Update preview
    redraw();

    lastPos.current = currentPos;
  }, [maskCanvas, brushSize, brushMode, redraw]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing.current) {
      // Save to history when stroke ends
      pushHistory(saveMaskSnapshot(maskCanvas));
    }
    isDrawing.current = false;
    lastPos.current = null;
  }, [maskCanvas, pushHistory]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    e.preventDefault();
    isDrawing.current = true;
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    lastPos.current = {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !canvasRef.current || !lastPos.current) return;
    e.preventDefault();

    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const currentPos = {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };

    drawBrushLine(maskCanvas, lastPos.current, currentPos, brushSize, brushMode, scaleX);
    redraw();
    lastPos.current = currentPos;
  }, [maskCanvas, brushSize, brushMode, redraw]);

  const handleTouchEnd = useCallback(() => {
    if (isDrawing.current) {
      pushHistory(saveMaskSnapshot(maskCanvas));
    }
    isDrawing.current = false;
    lastPos.current = null;
  }, [maskCanvas, pushHistory]);

  const handleUndo = useCallback(async () => {
    const snapshot = undo();
    if (snapshot) {
      await restoreMaskSnapshot(maskCanvas, snapshot);
      redraw();
      forceUpdate((n) => n + 1);
    }
  }, [undo, maskCanvas, redraw]);

  const handleRedo = useCallback(async () => {
    const snapshot = redo();
    if (snapshot) {
      await restoreMaskSnapshot(maskCanvas, snapshot);
      redraw();
      forceUpdate((n) => n + 1);
    }
  }, [redo, maskCanvas, redraw]);

  const handleDownload = useCallback(async () => {
    const exportCanvas = createExportCanvas(originalImage, maskCanvas, {
      type: backgroundType,
      color: backgroundColor,
      image: backgroundImage ?? undefined,
    });
    await downloadCanvas(exportCanvas);
  }, [originalImage, maskCanvas, backgroundType, backgroundColor, backgroundImage]);

  // Calculate cursor style
  const cursorStyle = brushMode === 'erase'
    ? 'crosshair'
    : 'crosshair';

  const aspectRatio = originalImage.naturalWidth / originalImage.naturalHeight;

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        {/* Left - Back & Status */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            title="Back to preview"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-md">
            EDITING
          </span>
          <span className="text-gray-text text-sm hidden sm:inline">
            Use brush to refine the mask
          </span>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            title="Remove image"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <Button variant="primary" size="sm" onClick={handleDownload}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Canvas Area */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-4">
          <div className="relative w-full" style={{ aspectRatio }}>
            {/* Checkerboard background */}
            <div className="absolute inset-0 checkerboard rounded-lg" />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full rounded-lg"
              style={{ cursor: cursorStyle }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-72 space-y-4">
          <BrushPanel
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
          />
          <BackgroundPanel />
        </div>
      </div>
    </div>
  );
}
