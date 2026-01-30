/**
 * RefineEdgesModal.tsx
 * 
 * Full-screen modal overlay for refining background removal edges.
 * Provides zoom/pan canvas and brush tools for precise mask editing.
 * 
 * Features:
 * - Eraser tool: Remove leftover background artifacts
 * - Restore tool: Bring back accidentally removed details
 * - Zoom (1.0x-4.0x) for precision work
 * - Pan with Space+drag for navigation
 * - Reset All Edits to restore original mask state
 * 
 * Exit Options:
 * - Finish Refining: Return to editor with changes
 * - Apply & Done: Save all changes and exit editor
 * - Exit Editor: Discard changes and exit
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { restoreMaskSnapshot, saveMaskSnapshot } from '@/lib/brushTool';
import Button from '@/components/ui/Button';
import RefineEdgesCanvas from './RefineEdgesCanvas';
import RefineEdgesControls from './RefineEdgesControls';

interface RefineEdgesModalProps {
  originalImage: HTMLImageElement;
  maskCanvas: HTMLCanvasElement;
  onFinishRefining: () => void;  // Return to editor with changes
  onApplyAndDone: () => void;    // Apply all and exit editor
  onExitEditor: () => void;      // Discard and exit editor
}

export default function RefineEdgesModal({
  originalImage,
  maskCanvas,
  onFinishRefining,
  onApplyAndDone,
  onExitEditor,
}: RefineEdgesModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Store state
  const isRefineModalOpen = useAppStore((state) => state.isRefineModalOpen);
  const closeRefineModal = useAppStore((state) => state.closeRefineModal);
  const preRefineMaskSnapshot = useAppStore((state) => state.preRefineMaskSnapshot);
  const pushHistory = useAppStore((state) => state.pushHistory);
  
  // Local state for unsaved changes warning
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'finish' | 'exit' | null>(null);
  
  // Track if any edits were made during this session
  const [hasSessionEdits, setHasSessionEdits] = useState(false);

  // Focus trap for accessibility - keeps focus within modal
  useEffect(() => {
    if (!isRefineModalOpen || !modalRef.current) return;

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
  }, [isRefineModalOpen]);

  // ESC key handling - show confirm dialog if edits were made
  useEffect(() => {
    if (!isRefineModalOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinishRefining();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isRefineModalOpen, hasSessionEdits]);

  // Handler for "Finish Refining" - returns to editor with changes
  const handleFinishRefining = useCallback(() => {
    // Save final state to history if edits were made
    if (hasSessionEdits) {
      pushHistory(saveMaskSnapshot(maskCanvas));
    }
    closeRefineModal();
    onFinishRefining();
  }, [hasSessionEdits, maskCanvas, pushHistory, closeRefineModal, onFinishRefining]);

  // Handler for "Apply & Done" - applies all and exits editor
  const handleApplyAndDone = useCallback(() => {
    // Save final state to history
    if (hasSessionEdits) {
      pushHistory(saveMaskSnapshot(maskCanvas));
    }
    closeRefineModal();
    onApplyAndDone();
  }, [hasSessionEdits, maskCanvas, pushHistory, closeRefineModal, onApplyAndDone]);

  // Handler for "Exit Editor" - discard and exit
  const handleExitEditor = useCallback(() => {
    if (hasSessionEdits) {
      setPendingAction('exit');
      setShowConfirmDialog(true);
    } else {
      closeRefineModal();
      onExitEditor();
    }
  }, [hasSessionEdits, closeRefineModal, onExitEditor]);

  // Confirm discard changes
  const handleConfirmDiscard = useCallback(async () => {
    // Restore mask to pre-refine state
    if (preRefineMaskSnapshot) {
      await restoreMaskSnapshot(maskCanvas, preRefineMaskSnapshot);
    }
    setShowConfirmDialog(false);
    closeRefineModal();
    
    if (pendingAction === 'exit') {
      onExitEditor();
    }
  }, [preRefineMaskSnapshot, maskCanvas, closeRefineModal, pendingAction, onExitEditor]);

  // Reset all edits - restore to pre-refine snapshot
  const handleResetAllEdits = useCallback(async () => {
    if (preRefineMaskSnapshot) {
      await restoreMaskSnapshot(maskCanvas, preRefineMaskSnapshot);
      setHasSessionEdits(false);
    }
  }, [preRefineMaskSnapshot, maskCanvas]);

  // Callback when user makes an edit
  const handleEditMade = useCallback(() => {
    setHasSessionEdits(true);
  }, []);

  // Don't render if modal is not open
  if (!isRefineModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="refine-edges-title"
    >
      <div
        ref={modalRef}
        className="relative bg-gray-900 rounded-2xl shadow-2xl max-w-[95vw] max-h-[95vh] w-full h-full flex overflow-hidden"
      >
        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-3">
              <h2 id="refine-edges-title" className="text-xl font-semibold text-white">
                Refine Edges
              </h2>
              {hasSessionEdits && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                  Unsaved changes
                </span>
              )}
            </div>
            {/* Close button */}
            <button
              onClick={handleFinishRefining}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              aria-label="Close refine edges"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Canvas Preview Area */}
          <div className="flex-1 overflow-hidden">
            <RefineEdgesCanvas
              originalImage={originalImage}
              maskCanvas={maskCanvas}
              onEditMade={handleEditMade}
            />
          </div>
        </div>

        {/* Right Sidebar - Controls */}
        <div className="w-[320px] bg-white border-l border-gray-200 flex flex-col">
          {/* Scrollable Controls */}
          <div className="flex-1 overflow-y-auto p-4">
            <RefineEdgesControls onResetAllEdits={handleResetAllEdits} />
          </div>

          {/* Action Buttons (fixed at bottom) */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            {/* Primary CTA - Finish Refining */}
            <Button
              variant="primary"
              className="w-full"
              onClick={handleFinishRefining}
            >
              Finish Refining
            </Button>
            
            {/* Secondary CTA - Apply & Done */}
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleApplyAndDone}
            >
              Apply & Done
            </Button>
            
            {/* Ghost CTA - Exit Editor */}
            <Button
              variant="ghost"
              className="w-full text-gray-500"
              onClick={handleExitEditor}
            >
              Exit Editor
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm Discard Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Discard refinements?
            </h3>
            <p className="text-gray-600 mb-6">
              You have unsaved edge refinements. Are you sure you want to discard them?
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
    </div>
  );
}
