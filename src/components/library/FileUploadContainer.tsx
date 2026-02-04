"use client";

interface FileUploadContainerProps {
  onOpenFileDialog: () => void;
  isImporting: boolean;
  error: string | null;
  clearError: () => void;
}

export function FileUploadContainer({
  onOpenFileDialog,
  isImporting,
  error,
  clearError,
}: FileUploadContainerProps) {
  return (
    <>
      {/* Open PDF button */}
      <button
        type="button"
        onClick={onOpenFileDialog}
        className="px-4 py-2 text-sm font-medium bg-(--color-accent) text-white rounded-lg hover:bg-(--color-accent-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2"
      >
        Open PDF
      </button>

      {/* Loading indicator */}
      {isImporting && (
        <div className="fixed bottom-20 right-6 z-40 bg-(--color-surface) border border-(--color-border) rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
          <svg
            aria-hidden="true"
            className="animate-spin text-(--color-accent)"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" opacity="0.25" />
            <path
              d="M10 2a8 8 0 0 1 8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-sm text-(--color-foreground)">Importing...</span>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-(--color-danger) text-white rounded-lg px-4 py-3 shadow-lg flex items-start gap-3">
          <p className="text-sm flex-1 whitespace-pre-line">{error}</p>
          <button
            type="button"
            onClick={clearError}
            className="shrink-0 p-0.5 hover:bg-white/20 rounded transition-colors"
            aria-label="Dismiss error"
          >
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
