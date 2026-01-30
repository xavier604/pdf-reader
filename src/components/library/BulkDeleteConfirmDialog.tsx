"use client";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface BulkDeleteConfirmDialogProps {
  isOpen: boolean;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BulkDeleteConfirmDialog({
  isOpen,
  count,
  onConfirm,
  onCancel,
}: BulkDeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={`Delete ${count} PDFs?`}
      description={
        <>
          Are you sure you want to delete {count} {count === 1 ? "PDF" : "PDFs"}? This action cannot
          be undone.
        </>
      }
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
