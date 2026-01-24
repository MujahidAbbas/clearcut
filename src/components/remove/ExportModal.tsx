import { useEffect, useRef } from 'react';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

interface ExportModalProps {
  isOpen: boolean;
  state: 'loading' | 'success' | 'error';
  errorMessage?: string;
  onClose: () => void;
  onRetry: () => void;
}

export default function ExportModal({
  isOpen,
  state,
  errorMessage,
  onClose,
  onRetry,
}: ExportModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      // Don't allow ESC during loading
      if (e.key === 'Escape' && state !== 'loading') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, state, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

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
  }, [isOpen, state]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-200 scale-100"
      >
        {state === 'loading' && (
          <div className="flex flex-col items-center text-center">
            <Spinner size="lg" className="text-primary mb-6" />
            <h2 id="modal-title" className="text-2xl font-semibold text-gray-900 mb-2">
              Exporting your image...
            </h2>
            <p className="text-gray-600">
              Generating HD quality result locally.
            </p>
          </div>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 id="modal-title" className="text-2xl font-semibold text-gray-900 mb-4">
              Your image is ready
            </h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Clearcut is a solo project built to provide free, private background removal for
              everyone. If this tool saved you some time, a small tip helps keep the servers
              running!
            </p>
            <a
              href="https://ko-fi.com/mujahiddev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-red-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-600 transition-all duration-200 hover:scale-[1.02] mb-3 w-full"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              Support
            </a>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200 text-sm"
            >
              Maybe later
            </button>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 id="modal-title" className="text-2xl font-semibold text-gray-900 mb-2">
              Export failed
            </h2>
            <p className="text-gray-700 mb-6">
              {errorMessage || 'An unexpected error occurred during export.'}
            </p>
            <div className="flex gap-3 w-full">
              <Button
                variant="primary"
                className="flex-1"
                onClick={onRetry}
              >
                Retry
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
