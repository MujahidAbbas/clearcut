import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/appStore';
import Button from '@/components/ui/Button';
import EditPreview from './EditPreview';

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

  // ESC key handling (placeholder for now - unsaved changes check comes in Plan 05)
  useEffect(() => {
    if (!isEditModalOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // TODO: Plan 05 - check for unsaved changes before closing
        // For now, do nothing
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isEditModalOpen]);

  if (!isEditModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
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
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors duration-200"
              disabled
            >
              Before/After
            </button>
          </div>

          {/* Canvas Preview */}
          <div className="flex-1 overflow-hidden">
            <EditPreview originalImage={originalImage} maskCanvas={maskCanvas} />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[360px] bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Background Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Background</h3>
              <div className="bg-gray-700/50 rounded-lg p-4 text-gray-400 text-sm">
                Placeholder for background controls
              </div>
            </div>

            {/* BG Filters Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">BG Filters</h3>
              <div className="bg-gray-700/50 rounded-lg p-4 text-gray-400 text-sm">
                Placeholder for background filter controls
              </div>
            </div>

            {/* Transform Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Transform</h3>
              <div className="bg-gray-700/50 rounded-lg p-4 text-gray-400 text-sm">
                Placeholder for transform controls
              </div>
            </div>

            {/* Aspect Ratio Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Aspect Ratio</h3>
              <div className="bg-gray-700/50 rounded-lg p-4 text-gray-400 text-sm">
                Placeholder for aspect ratio controls
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="p-6 border-t border-gray-700 flex gap-3">
            <Button
              variant="ghost"
              className="flex-1 text-gray-300 hover:text-white"
              onClick={onClose}
            >
              Exit Editor
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={onApply}
            >
              Apply & Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
