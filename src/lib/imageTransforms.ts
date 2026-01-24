export interface TransformState {
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  zoom: number;
  pan: { x: number; y: number };
}

/**
 * Apply transforms to canvas context using save/restore pattern.
 * MUST be called within ctx.save()/ctx.restore() block.
 */
export function applyTransforms(
  ctx: CanvasRenderingContext2D,
  transforms: TransformState,
  canvasWidth: number,
  canvasHeight: number
): void {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // Pan
  ctx.translate(transforms.pan.x, transforms.pan.y);

  // Translate to center for rotation/flip
  ctx.translate(centerX, centerY);

  // Apply zoom
  ctx.scale(transforms.zoom, transforms.zoom);

  // Apply rotation (convert degrees to radians)
  ctx.rotate((transforms.rotation * Math.PI) / 180);

  // Apply flips
  ctx.scale(
    transforms.flipHorizontal ? -1 : 1,
    transforms.flipVertical ? -1 : 1
  );

  // Translate back
  ctx.translate(-centerX, -centerY);
}

/**
 * Calculate crop rectangle for aspect ratio.
 */
export function calculateCropRect(
  imageWidth: number,
  imageHeight: number,
  aspectRatio: 'original' | 'free' | '1:1' | '4:3' | '16:9' | '9:16'
): { sx: number; sy: number; sWidth: number; sHeight: number } {
  if (aspectRatio === 'original' || aspectRatio === 'free') {
    return { sx: 0, sy: 0, sWidth: imageWidth, sHeight: imageHeight };
  }

  const ratios: Record<string, number> = {
    '1:1': 1,
    '4:3': 4/3,
    '16:9': 16/9,
    '9:16': 9/16
  };

  const targetRatio = ratios[aspectRatio];
  const currentRatio = imageWidth / imageHeight;

  if (currentRatio > targetRatio) {
    // Image is wider, crop width
    const newWidth = imageHeight * targetRatio;
    return {
      sx: (imageWidth - newWidth) / 2,
      sy: 0,
      sWidth: newWidth,
      sHeight: imageHeight
    };
  } else {
    // Image is taller, crop height
    const newHeight = imageWidth / targetRatio;
    return {
      sx: 0,
      sy: (imageHeight - newHeight) / 2,
      sWidth: imageWidth,
      sHeight: newHeight
    };
  }
}

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Apply crop to create new cropped image and mask canvases.
 * Returns new HTMLImageElement and HTMLCanvasElement for the cropped region.
 */
export async function applyCrop(
  originalImage: HTMLImageElement,
  maskCanvas: HTMLCanvasElement,
  cropBox: CropBox,
  displayScale: number
): Promise<{ croppedImage: HTMLImageElement; croppedMask: HTMLCanvasElement }> {
  // Convert display coordinates to actual image coordinates
  const actualCrop = {
    x: Math.round(cropBox.x / displayScale),
    y: Math.round(cropBox.y / displayScale),
    width: Math.round(cropBox.width / displayScale),
    height: Math.round(cropBox.height / displayScale),
  };

  // Ensure crop is within bounds
  const clampedCrop = {
    x: Math.max(0, Math.min(actualCrop.x, originalImage.naturalWidth - 1)),
    y: Math.max(0, Math.min(actualCrop.y, originalImage.naturalHeight - 1)),
    width: Math.min(actualCrop.width, originalImage.naturalWidth - actualCrop.x),
    height: Math.min(actualCrop.height, originalImage.naturalHeight - actualCrop.y),
  };

  // Create cropped image canvas
  const imageCanvas = document.createElement('canvas');
  imageCanvas.width = clampedCrop.width;
  imageCanvas.height = clampedCrop.height;
  const imageCtx = imageCanvas.getContext('2d')!;
  imageCtx.drawImage(
    originalImage,
    clampedCrop.x, clampedCrop.y, clampedCrop.width, clampedCrop.height,
    0, 0, clampedCrop.width, clampedCrop.height
  );

  // Create cropped mask canvas
  const croppedMask = document.createElement('canvas');
  croppedMask.width = clampedCrop.width;
  croppedMask.height = clampedCrop.height;
  const maskCtx = croppedMask.getContext('2d')!;
  maskCtx.drawImage(
    maskCanvas,
    clampedCrop.x, clampedCrop.y, clampedCrop.width, clampedCrop.height,
    0, 0, clampedCrop.width, clampedCrop.height
  );

  // Convert cropped image canvas to HTMLImageElement
  const croppedImage = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageCanvas.toDataURL('image/png');
  });

  return { croppedImage, croppedMask };
}
