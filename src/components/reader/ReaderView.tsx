"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { PdfViewerWrapper } from "@/components/reader/PdfViewerWrapper";
import { useThemeContext } from "@/components/shared/ThemeProvider";
import { useKeyboard } from "@/lib/hooks/useKeyboard";
import { usePdfLoader } from "@/lib/hooks/usePdfLoader";

interface ReaderViewProps {
  pdfId: string;
}

export function ReaderView({ pdfId }: ReaderViewProps) {
  const router = useRouter();
  const { blobUrl, loading: pdfLoading, error: pdfError } = usePdfLoader(pdfId);
  const { resolvedTheme } = useThemeContext();

  const handleBack = useCallback(() => {
    router.push("/");
  }, [router]);

  useKeyboard({ Escape: handleBack });

  // Loading state
  if (pdfLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-(--color-background)">
        <div className="flex flex-col items-center gap-3">
          <svg
            aria-hidden="true"
            className="animate-spin text-(--color-accent)"
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
          >
            <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path
              d="M16 4a12 12 0 0 1 12 12"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-sm text-(--color-text-secondary)">Loading PDF...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (pdfError || !blobUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-(--color-background)">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <svg
            aria-hidden="true"
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            stroke="var(--color-danger)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="24" cy="24" r="20" />
            <line x1="24" y1="14" x2="24" y2="28" />
            <circle cx="24" cy="34" r="1.5" fill="var(--color-danger)" />
          </svg>
          <p className="text-lg font-medium text-(--color-foreground)">
            {pdfError || "PDF not found"}
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 text-sm font-medium bg-(--color-accent) text-white rounded-lg hover:bg-(--color-accent-hover) transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-(--color-background)">
      <PdfViewerWrapper pdfId={pdfId} blobUrl={blobUrl} theme={resolvedTheme} />
    </div>
  );
}
