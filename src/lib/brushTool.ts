export interface BrushStroke {
  x: number;
  y: number;
  size: number;
  mode: 'erase' | 'restore';
}

/**
 * Get canvas coordinates from mouse/touch event
 * Handles CSS scaling between display size and actual canvas size
 */
export function getCanvasCoords(
  event: MouseEvent | TouchEvent,
  canvas: HTMLCanvasElement
): { x: number; y: number; scale: number } {
  const rect = canvas.getBoundingClientRect();

  // Get client coordinates
  let clientX: number, clientY: number;
  if ('touches' in event) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  // Calculate scale factors (CSS size vs actual canvas size)
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
    scale: scaleX,
  };
}

/**
 * Draw a brush stroke on the mask canvas
 */
export function drawBrushStroke(
  maskCanvas: HTMLCanvasElement,
  stroke: BrushStroke,
  scale: number = 1
): void {
  const ctx = maskCanvas.getContext('2d');
  if (!ctx) return;

  ctx.beginPath();
  ctx.arc(stroke.x, stroke.y, stroke.size * scale, 0, Math.PI * 2);

  if (stroke.mode === 'erase') {
    // Remove pixels from mask (reveals background)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fill();
  } else {
    // Add pixels to mask (reveals subject)
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.fill();
  }

  // Reset composite operation
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * Draw a line between two points (for smooth strokes)
 */
export function drawBrushLine(
  maskCanvas: HTMLCanvasElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
  size: number,
  mode: 'erase' | 'restore',
  scale: number = 1
): void {
  const ctx = maskCanvas.getContext('2d');
  if (!ctx) return;

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.lineWidth = size * scale * 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (mode === 'erase') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.stroke();
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
    ctx.stroke();
  }

  ctx.globalCompositeOperation = 'source-over';
}

/**
 * Save current mask state to data URL for history
 */
export function saveMaskSnapshot(maskCanvas: HTMLCanvasElement): string {
  return maskCanvas.toDataURL('image/png');
}

/**
 * Restore mask from data URL snapshot
 */
export async function restoreMaskSnapshot(
  maskCanvas: HTMLCanvasElement,
  snapshot: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ctx = maskCanvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      ctx.drawImage(img, 0, 0);
      resolve();
    };
    img.onerror = () => reject(new Error('Failed to load snapshot'));
    img.src = snapshot;
  });
}

/**
 * Create brush cursor CSS
 */
export function createBrushCursor(
  size: number,
  mode: 'erase' | 'restore'
): string {
  const canvas = document.createElement('canvas');
  const padding = 2;
  canvas.width = size * 2 + padding * 2;
  canvas.height = size * 2 + padding * 2;

  const ctx = canvas.getContext('2d');
  if (!ctx) return 'crosshair';

  // Draw brush preview circle
  ctx.beginPath();
  ctx.arc(size + padding, size + padding, size, 0, Math.PI * 2);
  ctx.strokeStyle = mode === 'erase' ? '#ff4444' : '#44ff44';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw crosshair
  ctx.beginPath();
  ctx.moveTo(size + padding - 4, size + padding);
  ctx.lineTo(size + padding + 4, size + padding);
  ctx.moveTo(size + padding, size + padding - 4);
  ctx.lineTo(size + padding, size + padding + 4);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.stroke();

  const dataUrl = canvas.toDataURL();
  return `url(${dataUrl}) ${size + padding} ${size + padding}, crosshair`;
}
