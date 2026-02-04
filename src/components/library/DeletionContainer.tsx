"use client";

import { useCallback, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { UndoToast } from "@/components/shared/UndoToast";
import type { PdfMetadata } from "@/types";

interface DeletionContainerProps {
  pdfs: PdfMetadata[];
  removePdf: (id: string) => void;
  removePdfs: (ids: string[]) => void;
  undoMessage: string | null;
  undoDelete: () => void;
  dismissUndo: () => void;
  children: (props: {
    onDeleteRequest: (id: string) => void;
    onBulkDeleteInitiate: (selectedIds: Set<string>) => void;
  }) => React.ReactNode;
}

export function DeletionContainer({
  pdfs,
  removePdf,
  removePdfs,
  undoMessage,
  undoDelete,
  dismissUndo,
  children,
}: DeletionContainerProps) {
  const pdfsRef = useRef(pdfs);
  pdfsRef.current = pdfs;

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const [bulkDeleteState, setBulkDeleteState] = useState<{
    ids: Set<string>;
    isOpen: boolean;
  }>({ ids: new Set(), isOpen: false });

  const handleDeleteRequest = useCallback((id: string) => {
    const pdf = pdfsRef.current.find((p) => p.id === id);
    if (pdf) {
      setDeleteTarget({ id: pdf.id, title: pdf.title });
    }
  }, []);

  const handleConfirmSingleDelete = useCallback(() => {
    if (deleteTarget) {
      removePdf(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, removePdf]);

  const handleConfirmBulkDelete = useCallback(() => {
    const ids = Array.from(bulkDeleteState.ids);
    removePdfs(ids);
    setBulkDeleteState({ ids: new Set(), isOpen: false });
  }, [bulkDeleteState.ids, removePdfs]);

  const handleBulkDeleteInitiate = useCallback((selectedIds: Set<string>) => {
    setBulkDeleteState({ ids: selectedIds, isOpen: true });
  }, []);

  return (
    <>
      {children({
        onDeleteRequest: handleDeleteRequest,
        onBulkDeleteInitiate: handleBulkDeleteInitiate,
      })}

      {/* Undo toast */}
      {undoMessage && (
        <UndoToast message={undoMessage} onUndo={undoDelete} onDismiss={dismissUndo} />
      )}

      {/* Single delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete PDF?"
        description={`Are you sure you want to delete \u201C${deleteTarget?.title ?? ""}\u201D?`}
        onConfirm={handleConfirmSingleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Bulk delete confirmation dialog */}
      <ConfirmDialog
        isOpen={bulkDeleteState.isOpen}
        title={`Delete ${bulkDeleteState.ids.size} PDFs?`}
        description={`Are you sure you want to delete ${bulkDeleteState.ids.size} ${bulkDeleteState.ids.size === 1 ? "PDF" : "PDFs"}?`}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkDeleteState({ ids: new Set(), isOpen: false })}
      />
    </>
  );
}

export type { DeletionContainerProps };
