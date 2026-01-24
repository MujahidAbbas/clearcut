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
