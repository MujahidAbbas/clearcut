import { useState, useCallback, useEffect, useRef } from 'react';
import UploadZone from './UploadZone';
import ProcessingState from './ProcessingState';
import ResultsView from './ResultsView';
import EditingView from './EditingView';
import EditModal from './EditModal';
import { initializeSegmenter, removeBackground } from '../../lib/segmentation';
import { renderComposite } from '../../lib/compositing';
import { saveMaskSnapshot } from '../../lib/brushTool';
import { useAppStore } from '../../stores/appStore';

type ViewState = 'upload' | 'processing' | 'result' | 'editing';

export default function BackgroundRemover() {
  const [viewState, setViewState] = useState<ViewState>('upload');
  const [previewVersion, setPreviewVersion] = useState(0);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    originalImage,
    setOriginalImage,
    maskCanvas,
    setMaskCanvas,
    setIsProcessing,
    modelLoaded,
    setModelLoaded,
    modelProgress,
    setModelProgress,
    backgroundType,
    backgroundColor,
    backgroundImage,
    isEditModalOpen,
    openEditModal,
    closeEditModal,
    resetEditState,
    pushHistory,
    reset,
  } = useAppStore();

  // Initialize model on mount
  useEffect(() => {
    if (!modelLoaded) {
      initializeSegmenter((progress) => {
        if (progress.progress !== undefined) {
          setModelProgress(progress.progress);
        }
      }).then(() => {
        setModelLoaded(true);
      }).catch((error) => {
        console.error('Failed to load model:', error);
      });
    }
  }, [modelLoaded, setModelLoaded, setModelProgress]);

  // Render composite when mask or background changes
  useEffect(() => {
    if (!originalImage || !maskCanvas || !previewCanvasRef.current) return;

    const ctx = previewCanvasRef.current.getContext('2d');
    if (!ctx) return;

    previewCanvasRef.current.width = originalImage.naturalWidth;
    previewCanvasRef.current.height = originalImage.naturalHeight;

    renderComposite(ctx, originalImage, maskCanvas, {
      type: backgroundType,
      color: backgroundColor,
      image: backgroundImage ?? undefined,
    });

    // Increment version to trigger re-render in ComparisonSlider
    setPreviewVersion(v => v + 1);
  }, [originalImage, maskCanvas, backgroundType, backgroundColor, backgroundImage]);

  const handleImageSelect = useCallback(async (file: File) => {
    // Load image
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      console.error('Failed to load image');
      setViewState('upload');
    };

    img.onload = async () => {
      // Revoke blob URL to prevent memory leak
      URL.revokeObjectURL(objectUrl);

      setOriginalImage(img);
      setViewState('processing');
      setIsProcessing(true);

      try {
        // Wait for model if not loaded
        if (!modelLoaded) {
          await initializeSegmenter();
          setModelLoaded(true);
        }

        // Process image
        const mask = await removeBackground(img);
        setMaskCanvas(mask);

        // Create preview canvas
        const preview = document.createElement('canvas');
        preview.width = img.naturalWidth;
        preview.height = img.naturalHeight;
        previewCanvasRef.current = preview;

        // Save initial state to history
        pushHistory(saveMaskSnapshot(mask));

        setViewState('result');
      } catch (error) {
        console.error('Processing failed:', error);
        setViewState('upload');
      } finally {
        setIsProcessing(false);
      }
    };
  }, [modelLoaded, setOriginalImage, setMaskCanvas, setIsProcessing, setModelLoaded, pushHistory]);

  const handleReset = useCallback(() => {
    reset();
    previewCanvasRef.current = null;
    setViewState('upload');
  }, [reset]);

  const handleEdit = useCallback(() => {
    openEditModal();
  }, [openEditModal]);

  const handleEditClose = useCallback(() => {
    closeEditModal();
  }, [closeEditModal]);

  const handleEditApply = useCallback(() => {
    // Re-render preview with current state (includes edit transforms/filters)
    if (originalImage && maskCanvas && previewCanvasRef.current) {
      const ctx = previewCanvasRef.current.getContext('2d');
      if (ctx) {
        // Note: For now, the preview just uses background state
        // Full edit state rendering would need to bake transforms into the canvas
        renderComposite(ctx, originalImage, maskCanvas, {
          type: backgroundType,
          color: backgroundColor,
          image: backgroundImage ?? undefined,
        });
      }
    }
    closeEditModal();
  }, [originalImage, maskCanvas, backgroundType, backgroundColor, backgroundImage, closeEditModal]);

  const handleBackToResult = useCallback(() => {
    // Re-render preview canvas with current mask state
    if (originalImage && maskCanvas && previewCanvasRef.current) {
      const ctx = previewCanvasRef.current.getContext('2d');
      if (ctx) {
        renderComposite(ctx, originalImage, maskCanvas, {
          type: backgroundType,
          color: backgroundColor,
          image: backgroundImage ?? undefined,
        });
      }
    }
    setViewState('result');
  }, [originalImage, maskCanvas, backgroundType, backgroundColor, backgroundImage]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-12 px-6">
      {/* Page Header (only for upload state) */}
      {viewState === 'upload' && (
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Unlimited & Free Background Removal
          </h1>
          <p className="text-gray-text text-lg max-w-2xl mx-auto">
            Upload your image to remove the background instantly.
            <br />
            Processing is 100% private and happens entirely in your browser.
          </p>
        </div>
      )}

      {/* Model Loading Indicator */}
      {!modelLoaded && viewState === 'upload' && (
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-400">
            Loading AI model... {Math.round(modelProgress)}%
          </p>
          <div className="w-48 h-1 bg-gray-200 rounded-full mt-2">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${modelProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      {viewState === 'upload' && (
        <UploadZone onImageSelect={handleImageSelect} disabled={!modelLoaded} />
      )}

      {viewState === 'processing' && (
        <ProcessingState />
      )}

      {viewState === 'result' &&
        originalImage &&
        maskCanvas &&
        previewCanvasRef.current && (
          <ResultsView
            originalImage={originalImage}
            previewCanvas={previewCanvasRef.current}
            previewVersion={previewVersion}
            maskCanvas={maskCanvas}
            onReset={handleReset}
            onEdit={handleEdit}
          />
        )}

      {viewState === 'editing' &&
        originalImage &&
        maskCanvas && (
          <EditingView
            originalImage={originalImage}
            maskCanvas={maskCanvas}
            onBack={handleBackToResult}
            onReset={handleReset}
          />
        )}

      {/* Edit Modal */}
      {isEditModalOpen && originalImage && maskCanvas && (
        <EditModal
          originalImage={originalImage}
          maskCanvas={maskCanvas}
          onClose={handleEditClose}
          onApply={handleEditApply}
        />
      )}
    </div>
  );
}
