"use client";

interface EmptyStateProps {
  onOpenFile: () => void;
}

export function EmptyState({ onOpenFile }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      {/* Document icon */}
      <svg
        aria-hidden="true"
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        stroke="var(--color-text-secondary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mb-6 opacity-50"
      >
        <rect x="12" y="6" width="40" height="52" rx="3" />
        <polyline points="38,6 38,22 52,22" />
        <line x1="38" y1="6" x2="52" y2="22" />
        <line x1="22" y1="32" x2="42" y2="32" />
        <line x1="22" y1="40" x2="42" y2="40" />
        <line x1="22" y1="48" x2="34" y2="48" />
      </svg>

      <h2 className="text-xl font-semibold text-(--color-foreground) mb-2">No PDFs yet</h2>

      <p className="text-(--color-text-secondary) mb-6">Drop a PDF here or click to open</p>

      <button
        type="button"
        onClick={onOpenFile}
        className="px-6 py-2.5 bg-(--color-accent) text-white font-medium rounded-lg hover:bg-(--color-accent-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2"
      >
        Open PDF
      </button>
    </div>
  );
}
