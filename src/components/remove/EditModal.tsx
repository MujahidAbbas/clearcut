import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import { saveMaskSnapshot } from '@/lib/brushTool';
import Button from '@/components/ui/Button';
import EditPreview from './EditPreview';
import BackgroundSelector from './BackgroundSelector';
import FilterControls from './FilterControls';
import TransformControls from './TransformControls';
import RefineEdgesModal from './RefineEdgesModal';

interface EditModalProps {
  originalImage: HTMLImageElement;
  maskCanvas: HTMLCanvasElement;
  onClose: () => void;
  onApply: () => void;
}

export default function EditModal({
  originalImage,
  maskCanvas,
  onClose,
  onApply,
}: EditModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isEditModalOpen = useAppStore((state) => state.isEditModalOpen);
  const hasUnsavedEdits = useAppStore((state) => state.hasUnsavedEdits);
  const setHasUnsavedEdits = useAppStore((state) => state.setHasUnsavedEdits);
  const resetEditState = useAppStore((state) => state.resetEditState);
  
  // Refine Edges modal state
  const isRefineModalOpen = useAppStore((state) => state.isRefineModalOpen);
  const openRefineModal = useAppStore((state) => state.openRefineModal);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showBefore, setShowBefore] = useState(false);
  
  // Preview version counter - incremented to force EditPreview re-render after mask changes
  const [previewVersion, setPreviewVersion] = useState(0);

  // Handler to open Refine Edges modal
  const handleOpenRefineEdges = useCallback(() => {
    // Save current mask state before opening refine modal
    const snapshot = saveMaskSnapshot(maskCanvas);
    openRefineModal(snapshot);
  }, [maskCanvas, openRefineModal]);

  // Handler when Refine Edges modal finishes (returns to edit modal)
  const handleRefineFinish = useCallback(() => {
    // Mark as having unsaved edits since mask may have changed
    setHasUnsavedEdits(true);
    // Increment preview version to force EditPreview to re-render with updated mask
    setPreviewVersion(v => v + 1);
  }, [setHasUnsavedEdits]);

  // Handler when "Apply & Done" is clicked from Refine Edges modal
  const handleRefineApplyAndDone = useCallback(() => {
    setHasUnsavedEdits(false);
    onApply();
  }, [setHasUnsavedEdits, onApply]);

  // Handler when "Exit Editor" is clicked from Refine Edges modal
  const handleRefineExitEditor = useCallback(() => {
    resetEditState();
    onClose();
  }, [resetEditState, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isEditModalOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => document.removeEventListener('keydown', handleTab);
  }, [isEditModalOpen]);

  // Handlers
  const handleExit = () => {
    if (hasUnsavedEdits) {
      setShowConfirmDialog(true);
    } else {
      handleClose();
    }
  };

  const handleConfirmDiscard = () => {
    setShowConfirmDialog(false);
    resetEditState();
    setHasUnsavedEdits(false);
    onClose();
  };

  const handleApply = () => {
    setHasUnsavedEdits(false);
    onApply();
  };

  const handleClose = () => {
    resetEditState();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleExit();
    }
  };

  // ESC key handling
  useEffect(() => {
    if (!isEditModalOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExit();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isEditModalOpen, hasUnsavedEdits]);

  if (!isEditModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="relative bg-gray-900 rounded-2xl shadow-2xl max-w-[95vw] max-h-[95vh] w-full h-full flex overflow-hidden"
      >
        {/* Preview Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
            <h2 id="edit-modal-title" className="text-xl font-semibold text-white">
              Edit Image
            </h2>
            <button
              onClick={() => setShowBefore(!showBefore)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors
                ${showBefore ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {showBefore ? 'Showing Before' : 'Show Before'}
            </button>
          </div>

          {/* Canvas Preview - key prop forces re-render when mask changes in Refine Edges */}
          <div className="flex-1 overflow-hidden">
            <EditPreview
              key={previewVersion}
              originalImage={originalImage}
              maskCanvas={maskCanvas}
              showBefore={showBefore}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[360px] bg-white border-l border-gray-200 flex flex-col">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <BackgroundSelector />
            <FilterControls />
            <TransformControls />

            {/* Refine Edges Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Edges</h3>
              <button
                onClick={handleOpenRefineEdges}
                className="w-full py-2.5 px-4 rounded-lg border-2 border-primary text-sm text-primary font-medium
                           bg-primary-light hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                title="Fine-tune background removal edges"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Refine Edges
              </button>
              <p className="text-xs text-gray-400">
                Fine-tune the edges of your cutout for cleaner results.
              </p>
            </div>
          </div>

          {/* Action Buttons (fixed at bottom) */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={handleApply}
            >
              Apply & Done
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleExit}
            >
              Exit Editor
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Discard changes?
            </h3>
            <p className="text-gray-600 mb-6">
              You have unsaved changes. Are you sure you want to exit?
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={handleConfirmDiscard}
              >
                Discard
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => setShowConfirmDialog(false)}
              >
                Keep Editing
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Refine Edges Modal */}
      {isRefineModalOpen && (
        <RefineEdgesModal
          originalImage={originalImage}
          maskCanvas={maskCanvas}
          onFinishRefining={handleRefineFinish}
          onApplyAndDone={handleRefineApplyAndDone}
          onExitEditor={handleRefineExitEditor}
        />
      )}
    </div>
  );
}
