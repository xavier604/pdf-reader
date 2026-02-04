"use client";

import { useCallback, useState } from "react";
import { BulkActionBar } from "@/components/library/BulkActionBar";
import type { PdfMetadata } from "@/types";

interface SelectionModeContainerProps {
  pdfs: PdfMetadata[];
  onBulkDeleteInitiate: (selectedIds: Set<string>) => void;
  children: (props: {
    selectionMode: boolean;
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onEnterSelectionMode: () => void;
    onCancelSelection: () => void;
  }) => React.ReactNode;
}

export function SelectionModeContainer({
  pdfs,
  onBulkDeleteInitiate,
  children,
}: SelectionModeContainerProps) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === pdfs.length) {
        return new Set();
      }
      return new Set(pdfs.map((p) => p.id));
    });
  }, [pdfs]);

  const handleCancelSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const handleEnterSelectionMode = useCallback(() => {
    setSelectionMode(true);
  }, []);

  const handleDeleteClick = useCallback(() => {
    onBulkDeleteInitiate(selectedIds);
    // Reset selection after initiating delete
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, [selectedIds, onBulkDeleteInitiate]);

  return (
    <>
      {selectionMode && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          totalCount={pdfs.length}
          allSelected={selectedIds.size === pdfs.length && pdfs.length > 0}
          onToggleAll={handleToggleAll}
          onCancel={handleCancelSelection}
          onDelete={handleDeleteClick}
        />
      )}
      {children({
        selectionMode,
        selectedIds,
        onToggleSelect: handleToggleSelect,
        onEnterSelectionMode: handleEnterSelectionMode,
        onCancelSelection: handleCancelSelection,
      })}
    </>
  );
}

export type { SelectionModeContainerProps };
