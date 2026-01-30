/**
 * RefineEdgesCanvas.tsx
 * 
 * Interactive canvas component for refining mask edges with zoom/pan support.
 * 
 * Features:
 * - Zoom: 1.0x to 4.0x via slider or pinch gesture
 * - Pan: Hold Space + drag (desktop) or two-finger drag (mobile)
 * - Brush: Eraser removes mask, Restore adds to mask
 * - Touch support: Pinch-to-zoom, two-finger pan, single finger draw
 * 
 * Implementation:
 * - Uses CSS transform for GPU-accelerated zoom/pan
 * - Brush coordinates converted from screen to canvas space
 * - Smooth line interpolation between brush points
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { renderComposite, drawCheckerboard } from '@/lib/compositing';
import { getCanvasCoords, drawBrushLine, saveMaskSnapshot, createBrushCursor } from '@/lib/brushTool';

interface RefineEdgesCanvasProps {
  originalImage: HTMLImageElement;
  maskCanvas: HTMLCanvasElement;
  onEditMade: () => void;  // Callback when user makes an edit
}

export default function RefineEdgesCanvas({
  originalImage,
  maskCanvas,
  onEditMade,
}: RefineEdgesCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drawing state refs (not in state for performance)
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const isPanning = useRef(false);
  const lastPanPos = useRef<{ x: number; y: number } | null>(null);
  
  // Touch gesture refs
  const touchStartDistance = useRef<number | null>(null);
  const touchStartZoom = useRef<number>(1);
  
  // Store state
  const brushSize = useAppStore((state) => state.brushSize);
  const brushMode = useAppStore((state) => state.brushMode);
  const refineEdgesState = useAppStore((state) => state.refineEdgesState);
  const setRefineZoom = useAppStore((state) => state.setRefineZoom);
  const setRefinePan = useAppStore((state) => state.setRefinePan);
  const setRefineSpacePressed = useAppStore((state) => state.setRefineSpacePressed);
  const pushHistory = useAppStore((state) => state.pushHistory);
  const backgroundType = useAppStore((state) => state.backgroundType);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const backgroundImage = useAppStore((state) => state.backgroundImage);
  
  const { zoom, pan, isSpacePressed } = refineEdgesState;
  
  // Force re-render counter
  const [, setRenderTrigger] = useState(0);

  // Redraw canvas with current mask state
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = originalImage.naturalWidth;
    canvas.height = originalImage.naturalHeight;

    // Render composite (background + masked foreground)
    renderComposite(ctx, originalImage, maskCanvas, {
      type: backgroundType,
      color: backgroundColor,
      image: backgroundImage ?? undefined,
    });
  }, [originalImage, maskCanvas, backgroundType, backgroundColor, backgroundImage]);

  // Initial render and re-render on dependency changes
  useEffect(() => {
    redraw();
  }, [redraw]);

  // Space key handling for pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setRefineSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setRefineSpacePressed(false);
        isPanning.current = false;
        lastPanPos.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setRefineSpacePressed]);

  // Get canvas coordinates accounting for zoom and pan
  const getAdjustedCoords = useCallback((e: MouseEvent | React.MouseEvent): { x: number; y: number; scale: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, scale: 1 };

    const rect = canvas.getBoundingClientRect();
    
    // Get client coordinates
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    // Calculate position relative to canvas element (accounting for CSS transform)
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;
    
    // Convert from display coordinates to canvas coordinates
    // Account for zoom and the CSS transform origin (center)
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    
    // Scale factors from display to actual canvas
    const scaleX = canvas.width / displayWidth;
    const scaleY = canvas.height / displayHeight;
    
    return {
      x: relX * scaleX,
      y: relY * scaleY,
      scale: scaleX,
    };
  }, []);

  // Mouse down handler
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    // If space is pressed, start panning
    if (isSpacePressed) {
      isPanning.current = true;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    
    // Otherwise, start drawing
    isDrawing.current = true;
    const coords = getAdjustedCoords(e.nativeEvent);
    lastPos.current = { x: coords.x, y: coords.y };
  }, [isSpacePressed, getAdjustedCoords]);

  // Mouse move handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // Handle panning
    if (isPanning.current && lastPanPos.current) {
      const deltaX = e.clientX - lastPanPos.current.x;
      const deltaY = e.clientY - lastPanPos.current.y;
      
      setRefinePan({
        x: pan.x + deltaX,
        y: pan.y + deltaY,
      });
      
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    
    // Handle drawing
    if (!isDrawing.current || !lastPos.current) return;
    
    const coords = getAdjustedCoords(e.nativeEvent);
    const currentPos = { x: coords.x, y: coords.y };
    
    // Draw brush line on mask
    drawBrushLine(maskCanvas, lastPos.current, currentPos, brushSize, brushMode, coords.scale);
    
    // Redraw preview
    redraw();
    
    lastPos.current = currentPos;
  }, [pan, setRefinePan, maskCanvas, brushSize, brushMode, redraw, getAdjustedCoords]);

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    // End panning
    if (isPanning.current) {
      isPanning.current = false;
      lastPanPos.current = null;
      return;
    }
    
    // End drawing - save to history
    if (isDrawing.current) {
      pushHistory(saveMaskSnapshot(maskCanvas));
      onEditMade();
    }
    
    isDrawing.current = false;
    lastPos.current = null;
  }, [maskCanvas, pushHistory, onEditMade]);

  // Mouse leave handler
  const handleMouseLeave = useCallback(() => {
    if (isDrawing.current) {
      pushHistory(saveMaskSnapshot(maskCanvas));
      onEditMade();
    }
    isDrawing.current = false;
    lastPos.current = null;
    isPanning.current = false;
    lastPanPos.current = null;
  }, [maskCanvas, pushHistory, onEditMade]);

  // Touch handlers for mobile support
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    // Two-finger gesture: zoom/pan
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      touchStartDistance.current = distance;
      touchStartZoom.current = zoom;
      
      // Calculate center for pan
      lastPanPos.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
      return;
    }
    
    // Single finger: draw
    if (e.touches.length === 1) {
      isDrawing.current = true;
      const touch = e.touches[0];
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      lastPos.current = {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
  }, [zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    // Two-finger gesture: zoom/pan
    if (e.touches.length === 2 && touchStartDistance.current !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // Calculate new distance for zoom
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const scale = distance / touchStartDistance.current;
      const newZoom = Math.max(1.0, Math.min(4.0, touchStartZoom.current * scale));
      setRefineZoom(newZoom);
      
      // Calculate center movement for pan
      if (lastPanPos.current) {
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        
        setRefinePan({
          x: pan.x + (centerX - lastPanPos.current.x),
          y: pan.y + (centerY - lastPanPos.current.y),
        });
        
        lastPanPos.current = { x: centerX, y: centerY };
      }
      return;
    }
    
    // Single finger: draw
    if (e.touches.length === 1 && isDrawing.current && lastPos.current) {
      const touch = e.touches[0];
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const currentPos = {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
      
      drawBrushLine(maskCanvas, lastPos.current, currentPos, brushSize, brushMode, scaleX);
      redraw();
      
      lastPos.current = currentPos;
    }
  }, [pan, setRefineZoom, setRefinePan, maskCanvas, brushSize, brushMode, redraw]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    // Reset two-finger gesture tracking
    if (e.touches.length < 2) {
      touchStartDistance.current = null;
      lastPanPos.current = null;
    }
    
    // End drawing
    if (e.touches.length === 0 && isDrawing.current) {
      pushHistory(saveMaskSnapshot(maskCanvas));
      onEditMade();
      isDrawing.current = false;
      lastPos.current = null;
    }
  }, [maskCanvas, pushHistory, onEditMade]);

  // Wheel handler for zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    // Zoom with Ctrl+wheel or trackpad pinch
    if (e.ctrlKey || e.metaKey) {
      const delta = -e.deltaY * 0.01;
      setRefineZoom(zoom + delta);
    }
  }, [zoom, setRefineZoom]);

  // Calculate cursor style based on mode and space key
  const getCursor = useCallback(() => {
    if (isSpacePressed) {
      return isPanning.current ? 'grabbing' : 'grab';
    }
    return createBrushCursor(brushSize / zoom, brushMode);
  }, [isSpacePressed, brushSize, zoom, brushMode]);

  // Calculate transform style for zoom/pan
  const transformStyle = {
    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
    transformOrigin: 'center center',
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gray-900 flex items-center justify-center overflow-hidden"
    >
      {/* Checkerboard background (doesn't zoom) */}
      <div className="absolute inset-0 checkerboard opacity-50" />
      
      {/* Zoom info badge */}
      {zoom > 1 && (
        <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 text-white text-sm rounded-lg z-10">
          {zoom.toFixed(1)}x zoom
          <span className="ml-2 text-gray-400 text-xs">
            (Space+drag to pan)
          </span>
        </div>
      )}
      
      {/* Canvas wrapper with zoom/pan transform */}
      <div
        className="relative transition-transform duration-75"
        style={transformStyle}
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full rounded-lg shadow-2xl"
          style={{ cursor: getCursor() }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        />
      </div>
    </div>
  );
}
