import { useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';

const FILTER_CONFIG = [
  { key: 'brightness', label: 'Brightness', min: 0, max: 200, default: 100, unit: '%' },
  { key: 'contrast', label: 'Contrast', min: 0, max: 200, default: 100, unit: '%' },
  { key: 'saturation', label: 'Saturation', min: 0, max: 200, default: 100, unit: '%' },
  { key: 'blur', label: 'Blur', min: 0, max: 20, default: 0, unit: 'px' },
] as const;

export default function FilterControls() {
  const editState = useAppStore((state) => state.editState);
  const setEditState = useAppStore((state) => state.setEditState);
  const setHasUnsavedEdits = useAppStore((state) => state.setHasUnsavedEdits);

  const { filters } = editState;

  const hasFilterChanges = useMemo(() => {
    return filters.brightness !== 100 ||
           filters.contrast !== 100 ||
           filters.saturation !== 100 ||
           filters.blur !== 0;
  }, [filters]);

  function handleFilterChange(key: keyof typeof filters, value: number) {
    setEditState({
      filters: { ...filters, [key]: value }
    });
    setHasUnsavedEdits(true);
  }

  function handleReset() {
    setEditState({
      filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0 }
    });
    // Note: Don't clear hasUnsavedEdits - reset is still a change
  }

  return (
    <div className="space-y-4">
      {/* Section Header with Reset */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">BG Filters</h3>
        <button
          onClick={handleReset}
          className="text-xs text-gray-500 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!hasFilterChanges}
        >
          Reset
        </button>
      </div>

      {/* Sliders */}
      {FILTER_CONFIG.map((filter) => (
        <div key={filter.key} className="space-y-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor={`filter-${filter.key}`}
              className="text-sm text-gray-600"
            >
              {filter.label}
            </label>
            <span className="text-xs text-gray-500 tabular-nums">
              {filters[filter.key]}{filter.unit}
            </span>
          </div>
          <input
            type="range"
            id={`filter-${filter.key}`}
            min={filter.min}
            max={filter.max}
            value={filters[filter.key]}
            onChange={(e) => handleFilterChange(filter.key, Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      ))}
    </div>
  );
}
