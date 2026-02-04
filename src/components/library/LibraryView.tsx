"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { DeletionContainer } from "@/components/library/DeletionContainer";
import { LibraryContent } from "@/components/library/LibraryContent";
import { SelectionModeContainer } from "@/components/library/SelectionModeContainer";
import { useLibrary } from "@/lib/hooks/useLibrary";
import type { PdfMetadata } from "@/types";

export function LibraryView() {
  const router = useRouter();
  const {
    pdfs,
    searchQuery,
    setSearchQuery,
    importFiles,
    removePdf,
    removePdfs,
    isImporting,
    error,
    clearError,
    sortField,
    sortOrder,
    handleSortChange,
    handleToggleStar,
    undoMessage,
    undoDelete,
    dismissUndo,
  } = useLibrary();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfsRef = useRef(pdfs);
  pdfsRef.current = pdfs;
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [detailsTarget, setDetailsTarget] = useState<PdfMetadata | null>(null);

  const handleOpenFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handlePdfClick = useCallback(
    (id: string) => {
      router.push(`/reader/${id}`);
    },
    [router],
  );

  const handleShowDetails = useCallback((id: string) => {
    const pdf = pdfsRef.current.find((p) => p.id === id);
    if (pdf) setDetailsTarget(pdf);
  }, []);

  const handleOpenFromDetails = useCallback(() => {
    if (detailsTarget) {
      router.push(`/reader/${detailsTarget.id}`);
      setDetailsTarget(null);
    }
  }, [detailsTarget, router]);

  const hasNoPdfs = pdfs.length === 0 && !searchQuery;
  const hasNoResults = pdfs.length === 0 && searchQuery.length > 0;

  return (
    <DeletionContainer
      pdfs={pdfs}
      removePdf={removePdf}
      removePdfs={removePdfs}
      undoMessage={undoMessage}
      undoDelete={undoDelete}
      dismissUndo={dismissUndo}
    >
      {({ onDeleteRequest, onBulkDeleteInitiate }) => (
        <SelectionModeContainer pdfs={pdfs} onBulkDeleteInitiate={onBulkDeleteInitiate}>
          {({
            selectionMode,
            selectedIds,
            onToggleSelect,
            onEnterSelectionMode,
            onCancelSelection,
          }) => (
            <LibraryContent
              pdfs={pdfs}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              importFiles={importFiles}
              isImporting={isImporting}
              error={error}
              clearError={clearError}
              sortField={sortField}
              sortOrder={sortOrder}
              handleSortChange={handleSortChange}
              handleToggleStar={handleToggleStar}
              fileInputRef={fileInputRef}
              handleOpenFileDialog={handleOpenFileDialog}
              handlePdfClick={handlePdfClick}
              onDeleteRequest={onDeleteRequest}
              handleShowDetails={handleShowDetails}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onEnterSelectionMode={onEnterSelectionMode}
              onCancelSelection={onCancelSelection}
              shortcutsOpen={shortcutsOpen}
              setShortcutsOpen={setShortcutsOpen}
              detailsTarget={detailsTarget}
              setDetailsTarget={setDetailsTarget}
              handleOpenFromDetails={handleOpenFromDetails}
              hasNoPdfs={hasNoPdfs}
              hasNoResults={hasNoResults}
            />
          )}
        </SelectionModeContainer>
      )}
    </DeletionContainer>
  );
}
