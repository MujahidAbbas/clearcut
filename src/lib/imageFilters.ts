export interface FilterState {
  brightness: number;  // 0-200%
  contrast: number;    // 0-200%
  saturation: number;  // 0-200%
  blur: number;        // 0-20px
}

/**
 * Build CSS filter string from filter state.
 * Returns 'none' if all values are at defaults.
 */
export function buildFilterString(filters: FilterState): string {
  const parts: string[] = [];

  if (filters.brightness !== 100) {
    parts.push(`brightness(${filters.brightness}%)`);
  }
  if (filters.contrast !== 100) {
    parts.push(`contrast(${filters.contrast}%)`);
  }
  if (filters.saturation !== 100) {
    parts.push(`saturate(${filters.saturation}%)`);
  }
  if (filters.blur > 0) {
    parts.push(`blur(${filters.blur}px)`);
  }

  return parts.length > 0 ? parts.join(' ') : 'none';
}

/**
 * Check if canvas filter property is supported.
 */
export function isFilterSupported(ctx: CanvasRenderingContext2D): boolean {
  return 'filter' in ctx;
}

/**
 * Apply filter to context. Checks support first.
 */
export function applyFilter(
  ctx: CanvasRenderingContext2D,
  filters: FilterState
): void {
  if (isFilterSupported(ctx)) {
    ctx.filter = buildFilterString(filters);
  }
}

/**
 * Reset filter on context.
 */
export function resetFilter(ctx: CanvasRenderingContext2D): void {
  if (isFilterSupported(ctx)) {
    ctx.filter = 'none';
  }
}
