"use client";

import { PdfCard } from "@/components/library/PdfCard";
import type { PdfMetadata } from "@/types";

interface PdfGridProps {
  pdfs: PdfMetadata[];
  onPdfClick: (id: string) => void;
  onPdfDelete: (id: string) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function PdfGrid({
  pdfs,
  onPdfClick,
  onPdfDelete,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
}: PdfGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {pdfs.map((pdf) => (
        <PdfCard
          key={pdf.id}
          pdf={pdf}
          onClick={() => onPdfClick(pdf.id)}
          onDelete={() => onPdfDelete(pdf.id)}
          selectionMode={selectionMode}
          selected={selectedIds?.has(pdf.id) ?? false}
          onToggleSelect={() => onToggleSelect?.(pdf.id)}
        />
      ))}
    </div>
  );
}
