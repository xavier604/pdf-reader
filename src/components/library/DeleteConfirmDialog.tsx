"use client";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  pdfTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  isOpen,
  pdfTitle,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Delete PDF?"
      description={
        <>Are you sure you want to delete &ldquo;{pdfTitle}&rdquo;? This action cannot be undone.</>
      }
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
