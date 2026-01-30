"use client";

import { formatFileSize } from "@/lib/utils";
import type { PdfMetadata } from "@/types";

interface StorageIndicatorProps {
  pdfs: PdfMetadata[];
}

export function StorageIndicator({ pdfs }: StorageIndicatorProps) {
  if (pdfs.length === 0) {
    return null;
  }

  const totalBytes = pdfs.reduce((sum, pdf) => sum + pdf.fileSizeBytes, 0);

  return (
    <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-3 text-center">
      <span className="text-xs text-(--color-text-secondary)">
        {pdfs.length} {pdfs.length === 1 ? "PDF" : "PDFs"} &middot; {formatFileSize(totalBytes)}
        {" used"}
      </span>
    </footer>
  );
}
