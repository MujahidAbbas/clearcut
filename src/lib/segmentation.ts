import { pipeline, env } from '@huggingface/transformers';
import type { ImageSegmentationPipeline } from '@huggingface/transformers';

// Configure environment
env.allowLocalModels = false;
env.useBrowserCache = true;

// Singleton pipeline instance
let segmenter: ImageSegmentationPipeline | null = null;

interface ProgressCallback {
  (progress: { status: string; progress?: number; file?: string }): void;
}

/**
 * Initialize the segmentation pipeline
 * Downloads and caches the model in IndexedDB
 */
export async function initializeSegmenter(
  onProgress?: ProgressCallback
): Promise<ImageSegmentationPipeline> {
  if (segmenter) return segmenter;

  // Detect optimal backend
  const device = await getOptimalDevice();

  segmenter = await pipeline('image-segmentation', 'briaai/RMBG-1.4', {
    device,
    progress_callback: onProgress,
  });

  return segmenter;
}

/**
 * Detect if WebGPU is available, fallback to WASM
 */
async function getOptimalDevice(): Promise<'webgpu' | 'wasm'> {
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
    try {
      const gpu = navigator.gpu as GPU;
      const adapter = await gpu.requestAdapter();
      if (adapter) return 'webgpu';
    } catch {
      // WebGPU not available
    }
  }
  return 'wasm';
}

interface RawImageMask {
  data: Uint8Array;
  width: number;
  height: number;
  channels: number;
}

/**
 * Process an image and return the segmentation mask
 */
export async function removeBackground(
  image: HTMLImageElement
): Promise<HTMLCanvasElement> {
  if (!segmenter) {
    throw new Error('Segmenter not initialized. Call initializeSegmenter first.');
  }

  // Create blob from image
  const blob = await imageToBlob(image);
  const imageUrl = URL.createObjectURL(blob);

  try {
    // Run segmentation
    const results = await segmenter(imageUrl);
    URL.revokeObjectURL(imageUrl);

    if (!results || results.length === 0) {
      throw new Error('No segmentation results returned');
    }

    // Convert RawImage mask to Canvas
    const mask = results[0].mask as unknown as RawImageMask;
    const maskCanvas = rawImageToCanvas(mask, image.naturalWidth, image.naturalHeight);
    return maskCanvas;
  } catch (error) {
    URL.revokeObjectURL(imageUrl);
    throw error;
  }
}

/**
 * Convert HTMLImageElement to Blob
 */
async function imageToBlob(img: HTMLImageElement): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(img, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, 'image/png');
  });
}

/**
 * Convert RawImage mask data to Canvas
 * RawImage has grayscale data (0-255) that represents alpha values
 */
function rawImageToCanvas(
  mask: RawImageMask,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = targetWidth;
  maskCanvas.height = targetHeight;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) throw new Error('Failed to get mask canvas context');

  // If mask size differs from target, we need to scale
  if (mask.width !== targetWidth || mask.height !== targetHeight) {
    // Create temp canvas at mask size
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = mask.width;
    tempCanvas.height = mask.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) throw new Error('Failed to get temp canvas context');

    const imageData = tempCtx.createImageData(mask.width, mask.height);

    // Convert grayscale to RGBA (white with variable alpha)
    for (let i = 0; i < mask.data.length; i++) {
      const alpha = mask.data[i];
      imageData.data[i * 4] = 255;     // R
      imageData.data[i * 4 + 1] = 255; // G
      imageData.data[i * 4 + 2] = 255; // B
      imageData.data[i * 4 + 3] = alpha; // A
    }

    tempCtx.putImageData(imageData, 0, 0);

    // Scale to target size
    maskCtx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
  } else {
    const imageData = maskCtx.createImageData(targetWidth, targetHeight);

    for (let i = 0; i < mask.data.length; i++) {
      const alpha = mask.data[i];
      imageData.data[i * 4] = 255;
      imageData.data[i * 4 + 1] = 255;
      imageData.data[i * 4 + 2] = 255;
      imageData.data[i * 4 + 3] = alpha;
    }

    maskCtx.putImageData(imageData, 0, 0);
  }

  return maskCanvas;
}

/**
 * Check if the segmenter is initialized
 */
export function isSegmenterReady(): boolean {
  return segmenter !== null;
}
