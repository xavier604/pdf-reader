"use client";

import { useEffect, useRef, useState } from "react";

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export function UndoToast({ message, onUndo, onDismiss, duration = 5000 }: UndoToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const [progressWidth, setProgressWidth] = useState(100);

  // Auto-dismiss after duration (uses ref to always call latest onDismiss)
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onDismissRef.current();
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [duration]);

  // Start progress bar animation on next frame
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setProgressWidth(0);
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  const handleUndo = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    onUndo();
  };

  return (
    <output
      aria-live="polite"
      className="fixed bottom-6 left-6 z-50 bg-(--color-surface) border border-(--color-border) rounded-lg shadow-lg max-w-sm overflow-hidden animate-slide-up block"
    >
      <div className="px-4 py-3 flex items-center gap-3">
        <span className="text-sm text-(--color-foreground) flex-1">{message}</span>
        <button
          type="button"
          onClick={handleUndo}
          className="text-sm font-medium text-(--color-accent) hover:underline shrink-0"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-0.5 hover:bg-(--color-surface-hover) rounded transition-colors text-(--color-text-secondary)"
          aria-label="Dismiss"
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
      <div
        className="h-0.5 bg-(--color-accent)"
        style={{
          width: `${progressWidth}%`,
          transition: `width ${duration}ms linear`,
        }}
      />
    </output>
  );
}
