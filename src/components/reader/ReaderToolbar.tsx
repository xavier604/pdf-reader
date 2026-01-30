"use client";

import { ThemeToggle } from "@/components/shared/ThemeToggle";

interface ReaderToolbarProps {
  onBack: () => void;
}

export function ReaderToolbar({ onBack }: ReaderToolbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-(--color-surface) border-b border-(--color-border)">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-(--color-foreground) hover:text-(--color-accent) transition-colors px-2 py-1.5 -ml-2 rounded-lg hover:bg-(--color-border)/50"
          aria-label="Back to library"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="14" y1="9" x2="4" y2="9" />
            <polyline points="9,4 4,9 9,14" />
          </svg>
          <span>Library</span>
        </button>

        {/* Theme toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
