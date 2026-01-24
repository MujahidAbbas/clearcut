import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore, type CropBox } from '@/stores/appStore';
import { applyTransforms } from '@/lib/imageTransforms';
import { applyFilter, resetFilter } from '@/lib/imageFilters';
import { drawMaskedForeground, drawCheckerboard } from '@/lib/compositing';

// Constants
const HANDLE_SIZE = 10;
const EDGE_THRESHOLD = 10;
const MIN_CROP_SIZE = 50;

// Aspect ratio values for crop calculation
const ASPECT_RATIO_VALUES: Record<string, number | null> = {
  'original': null,
  'free': null,
  '1:1': 1,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
};

// Cursor mapping for different handles
const CURSOR_MAP: Record<string, string> = {
  'tl': 'nwse-resize',
  'tr': 'nesw-resize',
  'bl': 'nesw-resize',
  'br': 'nwse-resize',
  'top': 'ns-resize',
  'bottom': 'ns-resize',
  'left': 'ew-resize',
  'right': 'ew-resize',
  'move': 'move',
  'default': 'default',
};

type HandleType = 'tl' | 'tr' | 'bl' | 'br' | 'top' | 'bottom' | 'left' | 'right' | 'move' | null;

interface DragState {
  isDragging: boolean;
  handleType: HandleType;
  startX: number;
  startY: number;
  startCrop: CropBox;
}

interface EditPreviewProps {
  originalImage: HTMLImageElement;
  maskCanvas: HTMLCanvasElement;
  showBefore?: boolean;
}

// Detect which handle or area was clicked
function detectHandle(
  x: number,
  y: number,
  crop: CropBox
): HandleType {
  const { x: cx, y: cy, width: cw, height: ch } = crop;

  // Corner handles (check first - smaller targets)
  // Top-left
  if (x >= cx - HANDLE_SIZE && x <= cx + HANDLE_SIZE &&
      y >= cy - HANDLE_SIZE && y <= cy + HANDLE_SIZE) {
    return 'tl';
  }
  // Top-right
  if (x >= cx + cw - HANDLE_SIZE && x <= cx + cw + HANDLE_SIZE &&
      y >= cy - HANDLE_SIZE && y <= cy + HANDLE_SIZE) {
    return 'tr';
  }
  // Bottom-left
  if (x >= cx - HANDLE_SIZE && x <= cx + HANDLE_SIZE &&
      y >= cy + ch - HANDLE_SIZE && y <= cy + ch + HANDLE_SIZE) {
    return 'bl';
  }
  // Bottom-right
  if (x >= cx + cw - HANDLE_SIZE && x <= cx + cw + HANDLE_SIZE &&
      y >= cy + ch - HANDLE_SIZE && y <= cy + ch + HANDLE_SIZE) {
    return 'br';
  }

  // Edge handles
  // Top edge
  if (y >= cy - EDGE_THRESHOLD && y <= cy + EDGE_THRESHOLD &&
      x > cx + HANDLE_SIZE && x < cx + cw - HANDLE_SIZE) {
    return 'top';
  }
  // Bottom edge
  if (y >= cy + ch - EDGE_THRESHOLD && y <= cy + ch + EDGE_THRESHOLD &&
      x > cx + HANDLE_SIZE && x < cx + cw - HANDLE_SIZE) {
    return 'bottom';
  }
  // Left edge
  if (x >= cx - EDGE_THRESHOLD && x <= cx + EDGE_THRESHOLD &&
      y > cy + HANDLE_SIZE && y < cy + ch - HANDLE_SIZE) {
    return 'left';
  }
  // Right edge
  if (x >= cx + cw - EDGE_THRESHOLD && x <= cx + cw + EDGE_THRESHOLD &&
      y > cy + HANDLE_SIZE && y < cy + ch - HANDLE_SIZE) {
    return 'right';
  }

  // Inside crop area (move)
  if (x > cx && x < cx + cw && y > cy && y < cy + ch) {
    return 'move';
  }

  return null;
}

// Calculate default crop box for an aspect ratio
function calculateDefaultCrop(
  canvasWidth: number,
  canvasHeight: number,
  aspectRatio: string
): CropBox {
  const targetRatio = ASPECT_RATIO_VALUES[aspectRatio];

  // For original/free, return full canvas
  if (targetRatio === null) {
    return { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
  }

  const currentRatio = canvasWidth / canvasHeight;
  let cropWidth: number;
  let cropHeight: number;

  if (currentRatio > targetRatio) {
    // Canvas is wider than target
    cropHeight = canvasHeight * 0.8; // 80% of canvas
    cropWidth = cropHeight * targetRatio;
  } else {
    // Canvas is taller than target
    cropWidth = canvasWidth * 0.8;
    cropHeight = cropWidth / targetRatio;
  }

  return {
    x: (canvasWidth - cropWidth) / 2,
    y: (canvasHeight - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  };
}

// Enforce bounds on crop box
function enforceBounds(
  crop: CropBox,
  canvasWidth: number,
  canvasHeight: number,
  aspectRatio: number | null
): CropBox {
  let { x, y, width, height } = crop;

  // Enforce minimum size
  width = Math.max(MIN_CROP_SIZE, width);
  height = Math.max(MIN_CROP_SIZE, height);

  // If aspect ratio locked, adjust to fit
  if (aspectRatio !== null) {
    const maxWidthFromHeight = height * aspectRatio;
    const maxHeightFromWidth = width / aspectRatio;

    if (width > maxWidthFromHeight) {
      width = maxWidthFromHeight;
    } else {
      height = maxHeightFromWidth;
    }
  }

  // Clamp to canvas bounds
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x + width > canvasWidth) x = canvasWidth - width;
  if (y + height > canvasHeight) y = canvasHeight - height;

  // If still out of bounds, shrink
  if (width > canvasWidth) {
    width = canvasWidth;
    x = 0;
    if (aspectRatio !== null) height = width / aspectRatio;
  }
  if (height > canvasHeight) {
    height = canvasHeight;
    y = 0;
    if (aspectRatio !== null) width = height * aspectRatio;
  }

  return { x, y, width, height };
}

// Draw crop overlay
function drawCropOverlay(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  crop: CropBox,
  hoveredHandle: HandleType
) {
  // 1. Dimmed areas outside crop
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  // Top
  ctx.fillRect(0, 0, canvasWidth, crop.y);
  // Bottom
  ctx.fillRect(0, crop.y + crop.height, canvasWidth, canvasHeight - crop.y - crop.height);
  // Left
  ctx.fillRect(0, crop.y, crop.x, crop.height);
  // Right
  ctx.fillRect(crop.x + crop.width, crop.y, canvasWidth - crop.x - crop.width, crop.height);

  // 2. Dashed border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);
  ctx.setLineDash([]);

  // 3. Rule of thirds grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;

  const thirdW = crop.width / 3;
  const thirdH = crop.height / 3;

  ctx.beginPath();
  // Vertical lines
  ctx.moveTo(crop.x + thirdW, crop.y);
  ctx.lineTo(crop.x + thirdW, crop.y + crop.height);
  ctx.moveTo(crop.x + thirdW * 2, crop.y);
  ctx.lineTo(crop.x + thirdW * 2, crop.y + crop.height);
  // Horizontal lines
  ctx.moveTo(crop.x, crop.y + thirdH);
  ctx.lineTo(crop.x + crop.width, crop.y + thirdH);
  ctx.moveTo(crop.x, crop.y + thirdH * 2);
  ctx.lineTo(crop.x + crop.width, crop.y + thirdH * 2);
  ctx.stroke();

  // 4. Corner handles
  const handleSize = HANDLE_SIZE;
  const corners: { id: HandleType; x: number; y: number }[] = [
    { id: 'tl', x: crop.x - handleSize / 2, y: crop.y - handleSize / 2 },
    { id: 'tr', x: crop.x + crop.width - handleSize / 2, y: crop.y - handleSize / 2 },
    { id: 'bl', x: crop.x - handleSize / 2, y: crop.y + crop.height - handleSize / 2 },
    { id: 'br', x: crop.x + crop.width - handleSize / 2, y: crop.y + crop.height - handleSize / 2 },
  ];

  corners.forEach(corner => {
    const isHovered = hoveredHandle === corner.id;
    ctx.fillStyle = isHovered ? '#4563FF' : 'white';
    ctx.fillRect(corner.x, corner.y, handleSize, handleSize);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(corner.x, corner.y, handleSize, handleSize);
  });
}

export default function EditPreview({
  originalImage,
  maskCanvas,
  showBefore = false,
}: EditPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag state (local, not in store for performance)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    handleType: null,
    startX: 0,
    startY: 0,
    startCrop: { x: 0, y: 0, width: 0, height: 0 },
  });
  const [hoveredHandle, setHoveredHandle] = useState<HandleType>(null);
  const [cursor, setCursor] = useState('default');

  // Store state
  const editState = useAppStore((state) => state.editState);
  const setEditState = useAppStore((state) => state.setEditState);
  const setHasUnsavedEdits = useAppStore((state) => state.setHasUnsavedEdits);
  const backgroundType = useAppStore((state) => state.backgroundType);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const backgroundImage = useAppStore((state) => state.backgroundImage);

  const aspectRatioValue = ASPECT_RATIO_VALUES[editState.aspectRatio];
  const showCropOverlay = editState.aspectRatio !== 'original';

  // Get canvas coordinates from mouse event
  const getCanvasCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  // Initialize crop box when aspect ratio changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || editState.aspectRatio === 'original') {
      // Clear crop box for original
      if (editState.cropBox !== null) {
        setEditState({ cropBox: null });
      }
      return;
    }

    // Calculate display scale (canvas size / original image size)
    const displayScale = canvas.width / originalImage.width;

    // Initialize crop box if not set or if aspect ratio changed to a fixed one
    if (!editState.cropBox || aspectRatioValue !== null) {
      const defaultCrop = calculateDefaultCrop(
        canvas.width,
        canvas.height,
        editState.aspectRatio
      );
      setEditState({ cropBox: defaultCrop, cropDisplayScale: displayScale });
    } else {
      // Update display scale even if cropBox exists
      setEditState({ cropDisplayScale: displayScale });
    }
  }, [editState.aspectRatio, originalImage.width]);

  // Render preview
  const renderPreview = useCallback(() => {
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

    // 6. Apply filters to BACKGROUND ONLY
    applyFilter(ctx, editState.filters);

    // 7. Draw background
    if (backgroundType === 'color') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (backgroundType === 'image' && backgroundImage) {
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

    // 8. Reset filters before foreground
    resetFilter(ctx);

    // 9. Draw masked foreground
    drawMaskedForeground(ctx, originalImage, maskCanvas);

    // 10. Restore state
    ctx.restore();

    // 11. Draw crop overlay if needed
    if (showCropOverlay && editState.cropBox) {
      drawCropOverlay(ctx, canvas.width, canvas.height, editState.cropBox, hoveredHandle);
    }
  }, [editState, backgroundType, backgroundColor, backgroundImage, showBefore, hoveredHandle, originalImage, maskCanvas, showCropOverlay]);

  // Re-render when state changes
  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  // Initialize canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const containerWidth = container.clientWidth || 800;
    const containerHeight = container.clientHeight || 600;

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
  }, [originalImage, renderPreview]);

  // Mouse handlers for crop interaction
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showCropOverlay || !editState.cropBox) return;

    const { x, y } = getCanvasCoords(e);
    const handle = detectHandle(x, y, editState.cropBox);

    if (handle) {
      setDragState({
        isDragging: true,
        handleType: handle,
        startX: x,
        startY: y,
        startCrop: { ...editState.cropBox },
      });
      setCursor(handle === 'move' ? 'grabbing' : CURSOR_MAP[handle]);
    }
  }, [showCropOverlay, editState.cropBox, getCanvasCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = getCanvasCoords(e);

    // Update hover state when not dragging
    if (!dragState.isDragging) {
      if (showCropOverlay && editState.cropBox) {
        const handle = detectHandle(x, y, editState.cropBox);
        setHoveredHandle(handle);
        setCursor(handle ? CURSOR_MAP[handle] : 'default');
      }
      return;
    }

    // Handle dragging
    if (!editState.cropBox) return;

    const deltaX = x - dragState.startX;
    const deltaY = y - dragState.startY;
    const { startCrop, handleType } = dragState;

    let newCrop: CropBox;

    switch (handleType) {
      case 'move':
        newCrop = {
          ...startCrop,
          x: startCrop.x + deltaX,
          y: startCrop.y + deltaY,
        };
        break;

      case 'br': {
        let newWidth = startCrop.width + deltaX;
        let newHeight = startCrop.height + deltaY;

        if (aspectRatioValue !== null) {
          // Determine which dimension changed more
          const widthRatio = Math.abs(deltaX) / startCrop.width;
          const heightRatio = Math.abs(deltaY) / startCrop.height;

          if (widthRatio > heightRatio) {
            newHeight = newWidth / aspectRatioValue;
          } else {
            newWidth = newHeight * aspectRatioValue;
          }
        }

        newCrop = {
          x: startCrop.x,
          y: startCrop.y,
          width: newWidth,
          height: newHeight,
        };
        break;
      }

      case 'tl': {
        let newWidth = startCrop.width - deltaX;
        let newHeight = startCrop.height - deltaY;

        if (aspectRatioValue !== null) {
          const widthRatio = Math.abs(deltaX) / startCrop.width;
          const heightRatio = Math.abs(deltaY) / startCrop.height;

          if (widthRatio > heightRatio) {
            newHeight = newWidth / aspectRatioValue;
          } else {
            newWidth = newHeight * aspectRatioValue;
          }
        }

        newCrop = {
          x: startCrop.x + startCrop.width - newWidth,
          y: startCrop.y + startCrop.height - newHeight,
          width: newWidth,
          height: newHeight,
        };
        break;
      }

      case 'tr': {
        let newWidth = startCrop.width + deltaX;
        let newHeight = startCrop.height - deltaY;

        if (aspectRatioValue !== null) {
          const widthRatio = Math.abs(deltaX) / startCrop.width;
          const heightRatio = Math.abs(deltaY) / startCrop.height;

          if (widthRatio > heightRatio) {
            newHeight = newWidth / aspectRatioValue;
          } else {
            newWidth = newHeight * aspectRatioValue;
          }
        }

        newCrop = {
          x: startCrop.x,
          y: startCrop.y + startCrop.height - newHeight,
          width: newWidth,
          height: newHeight,
        };
        break;
      }

      case 'bl': {
        let newWidth = startCrop.width - deltaX;
        let newHeight = startCrop.height + deltaY;

        if (aspectRatioValue !== null) {
          const widthRatio = Math.abs(deltaX) / startCrop.width;
          const heightRatio = Math.abs(deltaY) / startCrop.height;

          if (widthRatio > heightRatio) {
            newHeight = newWidth / aspectRatioValue;
          } else {
            newWidth = newHeight * aspectRatioValue;
          }
        }

        newCrop = {
          x: startCrop.x + startCrop.width - newWidth,
          y: startCrop.y,
          width: newWidth,
          height: newHeight,
        };
        break;
      }

      case 'top': {
        let newHeight = startCrop.height - deltaY;
        let newWidth = startCrop.width;

        if (aspectRatioValue !== null) {
          newWidth = newHeight * aspectRatioValue;
        }

        const widthDiff = newWidth - startCrop.width;
        newCrop = {
          x: startCrop.x - widthDiff / 2,
          y: startCrop.y + startCrop.height - newHeight,
          width: newWidth,
          height: newHeight,
        };
        break;
      }

      case 'bottom': {
        let newHeight = startCrop.height + deltaY;
        let newWidth = startCrop.width;

        if (aspectRatioValue !== null) {
          newWidth = newHeight * aspectRatioValue;
        }

        const widthDiff = newWidth - startCrop.width;
        newCrop = {
          x: startCrop.x - widthDiff / 2,
          y: startCrop.y,
          width: newWidth,
          height: newHeight,
        };
        break;
      }

      case 'left': {
        let newWidth = startCrop.width - deltaX;
        let newHeight = startCrop.height;

        if (aspectRatioValue !== null) {
          newHeight = newWidth / aspectRatioValue;
        }

        const heightDiff = newHeight - startCrop.height;
        newCrop = {
          x: startCrop.x + startCrop.width - newWidth,
          y: startCrop.y - heightDiff / 2,
          width: newWidth,
          height: newHeight,
        };
        break;
      }

      case 'right': {
        let newWidth = startCrop.width + deltaX;
        let newHeight = startCrop.height;

        if (aspectRatioValue !== null) {
          newHeight = newWidth / aspectRatioValue;
        }

        const heightDiff = newHeight - startCrop.height;
        newCrop = {
          x: startCrop.x,
          y: startCrop.y - heightDiff / 2,
          width: newWidth,
          height: newHeight,
        };
        break;
      }

      default:
        return;
    }

    // Enforce bounds
    newCrop = enforceBounds(newCrop, canvas.width, canvas.height, aspectRatioValue);

    setEditState({ cropBox: newCrop });
    setHasUnsavedEdits(true);
  }, [dragState, editState.cropBox, showCropOverlay, aspectRatioValue, getCanvasCoords, setEditState, setHasUnsavedEdits]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState(prev => ({ ...prev, isDragging: false, handleType: null }));
      setCursor(hoveredHandle ? CURSOR_MAP[hoveredHandle] : 'default');
    }
  }, [dragState.isDragging, hoveredHandle]);

  const handleMouseLeave = useCallback(() => {
    setHoveredHandle(null);
    if (!dragState.isDragging) {
      setCursor('default');
    }
  }, [dragState.isDragging]);

  // Global mouse up listener (for when mouse released outside canvas)
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragState.isDragging) {
        setDragState(prev => ({ ...prev, isDragging: false, handleType: null }));
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [dragState.isDragging]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gray-900 flex items-center justify-center overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        style={{ cursor }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
