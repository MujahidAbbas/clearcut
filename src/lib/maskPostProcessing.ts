/**
 * Mask post-processing pipeline for cleaning up segmentation output.
 *
 * Applied in sequence:
 * 1. Min-max normalization — stretches alpha range to full 0-255 (BRIA recommended)
 * 2. Morphological opening (erode + dilate) — removes fringe noise without shrinking mask
 * 3. Gaussian blur on alpha (separable, 2-pass) — smooth anti-aliased edges
 *
 * Color decontamination is exported separately for use during compositing,
 * where it operates on the combined foreground (original image + mask applied).
 */

export interface PostProcessConfig {
  /** Min-max normalize the alpha channel. Default: true */
  normalize: boolean;
  /** Morphological opening passes (0 = disabled). Default: 1 */
  openingPasses: number;
  /** Gaussian blur radius in pixels (0 = disabled). Default: 0.5 */
  blurRadius: number;
}

export const defaultConfig: PostProcessConfig = {
  normalize: true,
  openingPasses: 1,
  blurRadius: 0.5,
};

// ---------------------------------------------------------------------------
// Gaussian kernel
// ---------------------------------------------------------------------------

function buildGaussianKernel(radius: number): Float32Array {
  const size = Math.ceil(radius) * 2 + 1;
  const kernel = new Float32Array(size);
  const sigma = radius / 2;
  const twoSigmaSq = 2 * sigma * sigma;
  let sum = 0;

  const center = (size - 1) / 2;
  for (let i = 0; i < size; i++) {
    const x = i - center;
    kernel[i] = Math.exp(-(x * x) / twoSigmaSq);
    sum += kernel[i];
  }

  for (let i = 0; i < size; i++) {
    kernel[i] /= sum;
  }

  return kernel;
}

// ---------------------------------------------------------------------------
// Step 1: Min-max alpha normalization
// ---------------------------------------------------------------------------

/**
 * Stretch the alpha channel so the actual min maps to 0 and actual max maps to 255.
 * This is BRIA's recommended post-processing for RMBG-1.4 output — it preserves
 * the model's soft alpha matte while using the full dynamic range.
 */
function normalizeAlpha(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): void {
  const len = width * height * 4;
  let min = 255;
  let max = 0;

  for (let i = 3; i < len; i += 4) {
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
  }

  if (max === min) return;
  const range = max - min;

  for (let i = 3; i < len; i += 4) {
    data[i] = Math.round(((data[i] - min) / range) * 255);
  }
}

// ---------------------------------------------------------------------------
// Step 2: Morphological opening (erode then dilate)
// ---------------------------------------------------------------------------

/**
 * 3×3 min-kernel erosion on the alpha channel.
 */
function erode(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): void {
  const len = width * height;
  const src = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    src[i] = data[i * 4 + 3];
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let min = src[y * width + x];
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const val = src[ny * width + nx];
          if (val < min) min = val;
        }
      }
      data[(y * width + x) * 4 + 3] = min;
    }
  }
}

/**
 * 3×3 max-kernel dilation on the alpha channel.
 */
function dilate(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): void {
  const len = width * height;
  const src = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    src[i] = data[i * 4 + 3];
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let max = src[y * width + x];
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const val = src[ny * width + nx];
          if (val > max) max = val;
        }
      }
      data[(y * width + x) * 4 + 3] = max;
    }
  }
}

/**
 * Morphological opening = erode then dilate.
 * Removes small noise/protrusions at the mask boundary, then recovers the
 * original mask size. Unlike erosion alone, this does NOT permanently shrink
 * the foreground subject.
 */
function morphologicalOpen(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  passes: number,
): void {
  for (let p = 0; p < passes; p++) {
    erode(data, width, height);
    dilate(data, width, height);
  }
}

// ---------------------------------------------------------------------------
// Step 3: Separable Gaussian blur on alpha
// ---------------------------------------------------------------------------

function gaussianBlurAlpha(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
): void {
  if (radius <= 0) return;

  const kernel = buildGaussianKernel(radius);
  const kHalf = (kernel.length - 1) / 2;
  const len = width * height;

  const alpha = new Float32Array(len);
  const temp = new Float32Array(len);

  for (let i = 0; i < len; i++) {
    alpha[i] = data[i * 4 + 3];
  }

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = 0; k < kernel.length; k++) {
        const sx = x + k - kHalf;
        const cx = sx < 0 ? 0 : sx >= width ? width - 1 : sx;
        sum += alpha[row + cx] * kernel[k];
      }
      temp[row + x] = sum;
    }
  }

  // Vertical pass
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let sum = 0;
      for (let k = 0; k < kernel.length; k++) {
        const sy = y + k - kHalf;
        const cy = sy < 0 ? 0 : sy >= height ? height - 1 : sy;
        sum += temp[cy * width + x] * kernel[k];
      }
      data[(y * width + x) * 4 + 3] = Math.round(sum);
    }
  }
}

// ---------------------------------------------------------------------------
// Color decontamination (for compositing stage)
// ---------------------------------------------------------------------------

/**
 * Decontaminate edge pixel colors by propagating clean foreground RGB outward.
 *
 * After masking (original image + alpha from mask), semi-transparent edge pixels
 * still carry RGB from the original background (e.g. green wall → green fringe).
 * This function replaces those contaminated RGB values with colors from nearby
 * fully-opaque foreground pixels using iterative neighbor propagation.
 *
 * Call this on the composited foreground ImageData (after destination-in masking),
 * NOT on the mask itself.
 */
export function decontaminateColors(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): void {
  const OPAQUE_THRESHOLD = 250;
  const TRANSPARENT_THRESHOLD = 5;
  const MAX_PASSES = 6;

  const len = width * height;

  // Working buffers for RGB and decontamination status
  const rgb = new Uint8Array(len * 3);
  const clean = new Uint8Array(len); // 1 = has clean foreground color

  // Initialize: extract RGB and mark opaque pixels as clean
  for (let i = 0; i < len; i++) {
    const i4 = i * 4;
    const i3 = i * 3;
    rgb[i3] = data[i4];
    rgb[i3 + 1] = data[i4 + 1];
    rgb[i3 + 2] = data[i4 + 2];
    if (data[i4 + 3] >= OPAQUE_THRESHOLD) {
      clean[i] = 1;
    }
  }

  // Propagate clean foreground colors outward into semi-transparent edge pixels.
  // Each pass, unclean pixels with clean neighbors adopt their averaged color.
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let changed = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;

        // Skip fully transparent, already clean, or fully opaque
        if (data[idx * 4 + 3] <= TRANSPARENT_THRESHOLD || clean[idx]) continue;

        let r = 0, g = 0, b = 0, count = 0;

        for (let dy = -1; dy <= 1; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            if (nx < 0 || nx >= width) continue;
            const nIdx = ny * width + nx;
            if (clean[nIdx]) {
              const n3 = nIdx * 3;
              r += rgb[n3];
              g += rgb[n3 + 1];
              b += rgb[n3 + 2];
              count++;
            }
          }
        }

        if (count > 0) {
          const i3 = idx * 3;
          rgb[i3] = Math.round(r / count);
          rgb[i3 + 1] = Math.round(g / count);
          rgb[i3 + 2] = Math.round(b / count);
          clean[idx] = 1;
          changed = true;
        }
      }
    }

    if (!changed) break;
  }

  // Write decontaminated RGB back to semi-transparent pixels only
  for (let i = 0; i < len; i++) {
    const alpha = data[i * 4 + 3];
    if (alpha > TRANSPARENT_THRESHOLD && alpha < OPAQUE_THRESHOLD) {
      const i4 = i * 4;
      const i3 = i * 3;
      data[i4] = rgb[i3];
      data[i4 + 1] = rgb[i3 + 1];
      data[i4 + 2] = rgb[i3 + 2];
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the mask post-processing pipeline on mask ImageData.
 * Operates on the alpha channel only (RGB is white filler in the mask).
 * Modifies in-place and returns the same ImageData.
 */
export function postProcessMask(
  imageData: ImageData,
  config: PostProcessConfig = defaultConfig,
): ImageData {
  const { data, width, height } = imageData;

  if (config.normalize) {
    normalizeAlpha(data, width, height);
  }

  if (config.openingPasses > 0) {
    morphologicalOpen(data, width, height, config.openingPasses);
  }

  if (config.blurRadius > 0) {
    gaussianBlurAlpha(data, width, height, config.blurRadius);
  }

  return imageData;
}
