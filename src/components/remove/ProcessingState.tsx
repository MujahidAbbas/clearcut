import Spinner from '../ui/Spinner';

interface ProcessingStateProps {
  progress?: number;
}

export default function ProcessingState({ progress }: ProcessingStateProps) {
  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl border border-gray-200 p-16 relative">
      {/* Status Label */}
      <span className="absolute top-6 right-6 text-sm text-gray-400">
        Processing
      </span>

      {/* Centered Content */}
      <div className="flex flex-col items-center justify-center">
        <Spinner size="lg" />

        <h3 className="text-xl font-semibold mt-8 mb-2">
          Removing background...
        </h3>
        <p className="text-gray-text">
          Processing locally in your browser
        </p>

        {/* Progress bar (optional) */}
        {typeof progress === 'number' && (
          <div className="w-full max-w-xs mt-6">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 text-center mt-2">
              {Math.round(progress)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
