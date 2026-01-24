import { useCallback, useState } from 'react';
import Button from '../ui/Button';
import ComparisonSlider from './ComparisonSlider';
import ExportModal from './ExportModal';
import { downloadCanvas, createExportCanvas } from '../../lib/compositing';
import { useAppStore } from '../../stores/appStore';

interface ResultsViewProps {
  originalImage: HTMLImageElement;
  previewCanvas: HTMLCanvasElement;
  previewVersion: number;
  maskCanvas: HTMLCanvasElement;
  onReset: () => void;
  onEdit: () => void;
}

export default function ResultsView({
  originalImage,
  previewCanvas,
  previewVersion,
  maskCanvas,
  onReset,
  onEdit,
}: ResultsViewProps) {
  const { sliderPosition, setSliderPosition, backgroundType, backgroundColor, backgroundImage, originalFileName } = useAppStore();

  const [exportState, setExportState] = useState<{
    isOpen: boolean;
    state: 'loading' | 'success' | 'error';
    errorMessage?: string;
  }>({ isOpen: false, state: 'loading' });

  const handleDownload = useCallback(async () => {
    // Open modal in loading state
    setExportState({ isOpen: true, state: 'loading' });

    const startTime = Date.now();

    try {
      // Create export canvas
      const exportCanvas = createExportCanvas(originalImage, maskCanvas, {
        type: backgroundType,
        color: backgroundColor,
        image: backgroundImage ?? undefined,
      });

      // Generate filename: {original}-nobg.png or fallback
      const baseName = originalFileName
        ? originalFileName.replace(/\.[^/.]+$/, '') // Remove extension
        : 'image';
      const filename = `${baseName}-nobg.png`;

      // Ensure minimum 2 second loading time for perceived quality
      const elapsed = Date.now() - startTime;
      const minDelay = 2000;
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }

      // Download the image
      await downloadCanvas(exportCanvas, filename);

      // Transition to success state
      setExportState({ isOpen: true, state: 'success' });
    } catch (error) {
      // Show error state
      setExportState({
        isOpen: true,
        state: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, [originalImage, maskCanvas, backgroundType, backgroundColor, backgroundImage, originalFileName]);

  const handleCloseModal = useCallback(() => {
    setExportState({ isOpen: false, state: 'loading' });
  }, []);

  const handleRetry = useCallback(() => {
    handleDownload();
  }, [handleDownload]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        {/* Left - Status & Instructions */}
        <div className="flex items-center gap-4">
          <span className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-md">
            RESULT
          </span>
          <span className="text-gray-text text-sm hidden sm:inline">
            Drag slider to compare
          </span>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-3">
          {/* Delete Button */}
          <button
            onClick={onReset}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            title="Remove image"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          {/* Edit Button */}
          <Button variant="secondary" size="sm" onClick={onEdit}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit & Refine
          </Button>

          {/* Download Button */}
          <Button variant="primary" size="sm" onClick={handleDownload}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </Button>
        </div>
      </div>

      {/* Comparison Slider */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <ComparisonSlider
          originalImage={originalImage}
          previewCanvas={previewCanvas}
          previewVersion={previewVersion}
          sliderPosition={sliderPosition}
          onSliderChange={setSliderPosition}
        />
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={exportState.isOpen}
        state={exportState.state}
        errorMessage={exportState.errorMessage}
        onClose={handleCloseModal}
        onRetry={handleRetry}
      />
    </div>
  );
}
