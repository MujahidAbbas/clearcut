export interface Background {
  type: 'transparent' | 'color' | 'image';
  color?: string;
  image?: HTMLImageElement;
}

/**
 * Render the final composited image
 * Layer order: Background -> Masked Subject
 */
export function renderComposite(
  ctx: CanvasRenderingContext2D,
  originalImage: HTMLImageElement,
  maskCanvas: HTMLCanvasElement,
  background: Background
): void {
  const { width, height } = ctx.canvas;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Layer 1: Draw background
  drawBackground(ctx, background, width, height);

  // Layer 2: Draw masked foreground
  drawMaskedForeground(ctx, originalImage, maskCanvas);
}

/**
 * Draw background layer
 */
function drawBackground(
  ctx: CanvasRenderingContext2D,
  background: Background,
  width: number,
  height: number
): void {
  switch (background.type) {
    case 'color':
      ctx.fillStyle = background.color || '#ffffff';
      ctx.fillRect(0, 0, width, height);
      break;

    case 'image':
      if (background.image) {
        // Cover the canvas while maintaining aspect ratio
        const scale = Math.max(
          width / background.image.width,
          height / background.image.height
        );
        const scaledWidth = background.image.width * scale;
        const scaledHeight = background.image.height * scale;
        const x = (width - scaledWidth) / 2;
        const y = (height - scaledHeight) / 2;
        ctx.drawImage(background.image, x, y, scaledWidth, scaledHeight);
      }
      break;

    case 'transparent':
    default:
      // Draw checkerboard pattern
      drawCheckerboard(ctx, width, height);
      break;
  }
}

/**
 * Draw checkerboard pattern for transparency indication
 */
function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  squareSize = 16
): void {
  const colors = ['#ffffff', '#f0f0f0'];

  for (let y = 0; y < height; y += squareSize) {
    for (let x = 0; x < width; x += squareSize) {
      const colorIndex = ((x / squareSize) + (y / squareSize)) % 2;
      ctx.fillStyle = colors[colorIndex];
      ctx.fillRect(x, y, squareSize, squareSize);
    }
  }
}

/**
 * Draw the original image masked by the segmentation mask
 */
function drawMaskedForeground(
  ctx: CanvasRenderingContext2D,
  originalImage: HTMLImageElement,
  maskCanvas: HTMLCanvasElement
): void {
  // Create temporary canvas for masked image
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = ctx.canvas.width;
  tempCanvas.height = ctx.canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  // Draw original image
  tempCtx.drawImage(originalImage, 0, 0, tempCanvas.width, tempCanvas.height);

  // Apply mask using destination-in composite operation
  tempCtx.globalCompositeOperation = 'destination-in';
  tempCtx.drawImage(maskCanvas, 0, 0, tempCanvas.width, tempCanvas.height);

  // Draw masked result onto main canvas
  ctx.drawImage(tempCanvas, 0, 0);
}

/**
 * Export canvas as PNG blob
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png',
  quality = 1.0
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to export canvas'));
      },
      type,
      quality
    );
  });
}

/**
 * Download canvas as file
 */
export async function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename = 'background-removed.png'
): Promise<void> {
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Create a composite canvas without checkerboard (for export)
 */
export function createExportCanvas(
  originalImage: HTMLImageElement,
  maskCanvas: HTMLCanvasElement,
  background: Background
): HTMLCanvasElement {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = originalImage.naturalWidth;
  exportCanvas.height = originalImage.naturalHeight;
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get export canvas context');

  // For transparent export, skip background entirely
  if (background.type === 'transparent') {
    drawMaskedForeground(ctx, originalImage, maskCanvas);
  } else {
    renderComposite(ctx, originalImage, maskCanvas, background);
  }

  return exportCanvas;
}
