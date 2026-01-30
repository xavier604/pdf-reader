"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BulkActionBar } from "@/components/library/BulkActionBar";
import { BulkDeleteConfirmDialog } from "@/components/library/BulkDeleteConfirmDialog";
import { DeleteConfirmDialog } from "@/components/library/DeleteConfirmDialog";
import { DropZone } from "@/components/library/DropZone";
import { EmptyState } from "@/components/library/EmptyState";
import { PdfGrid } from "@/components/library/PdfGrid";
import { SearchBar } from "@/components/library/SearchBar";
import { StorageIndicator } from "@/components/library/StorageIndicator";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useLibrary } from "@/lib/hooks/useLibrary";

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
  } = useLibrary();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfsRef = useRef(pdfs);
  pdfsRef.current = pdfs;
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const handleOpenFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFilesDropped = useCallback(
    (files: FileList) => {
      importFiles(files);
    },
    [importFiles],
  );

  const handlePdfClick = useCallback(
    (id: string) => {
      router.push(`/reader/${id}`);
    },
    [router],
  );

  const handlePdfDelete = useCallback((id: string) => {
    const pdf = pdfsRef.current.find((p) => p.id === id);
    if (pdf) {
      setDeleteTarget({ id: pdf.id, title: pdf.title });
    }
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget) {
      await removePdf(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, removePdf]);

  const handleCancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

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

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    await removePdfs(ids);
    setSelectedIds(new Set());
    setSelectionMode(false);
    setBulkDeleteOpen(false);
  }, [selectedIds, removePdfs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectionMode) {
        handleCancelSelection();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectionMode, handleCancelSelection]);

  const hasNoPdfs = pdfs.length === 0 && !searchQuery;
  const hasNoResults = pdfs.length === 0 && searchQuery.length > 0;

  return (
    <DropZone onFilesDropped={handleFilesDropped} fileInputRef={fileInputRef}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-(--color-background)/95 backdrop-blur-sm border-b border-(--color-border)">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-bold text-(--color-foreground) shrink-0">PDF Reader</h1>
            <div className="flex-1 max-w-md">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {pdfs.length > 0 && (
                <button
                  type="button"
                  onClick={() => (selectionMode ? handleCancelSelection() : setSelectionMode(true))}
                  className="px-3 py-2 text-sm font-medium rounded-lg bg-(--color-surface-hover) text-(--color-foreground) hover:bg-(--color-border) transition-colors"
                >
                  {selectionMode ? "Cancel" : "Select"}
                </button>
              )}
              <button
                type="button"
                onClick={handleOpenFileDialog}
                className="px-4 py-2 text-sm font-medium bg-(--color-accent) text-white rounded-lg hover:bg-(--color-accent-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2"
              >
                Open PDF
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Bulk action bar */}
      {selectionMode && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          totalCount={pdfs.length}
          allSelected={selectedIds.size === pdfs.length && pdfs.length > 0}
          onToggleAll={handleToggleAll}
          onCancel={handleCancelSelection}
          onDelete={() => setBulkDeleteOpen(true)}
        />
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {hasNoPdfs && <EmptyState onOpenFile={handleOpenFileDialog} />}

        {pdfs.length > 0 && (
          <PdfGrid
            pdfs={pdfs}
            onPdfClick={handlePdfClick}
            onPdfDelete={handlePdfDelete}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
          />
        )}

        {hasNoResults && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg
              aria-hidden="true"
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              stroke="var(--color-text-secondary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-4 opacity-50"
            >
              <circle cx="20" cy="20" r="14" />
              <line x1="30" y1="30" x2="42" y2="42" />
            </svg>
            <p className="text-(--color-text-secondary) text-lg">No matching PDFs</p>
            <p className="text-(--color-text-secondary) text-sm mt-1">
              Try a different search term
            </p>
          </div>
        )}
      </main>

      {/* Storage usage */}
      <StorageIndicator pdfs={pdfs} />

      {/* Loading indicator */}
      {isImporting && (
        <div className="fixed bottom-20 right-6 z-40 bg-(--color-surface) border border-(--color-border) rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
          <svg
            aria-hidden="true"
            className="animate-spin text-(--color-accent)"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" opacity="0.25" />
            <path
              d="M10 2a8 8 0 0 1 8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-sm text-(--color-foreground)">Importing...</span>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-(--color-danger) text-white rounded-lg px-4 py-3 shadow-lg flex items-start gap-3">
          <p className="text-sm flex-1 whitespace-pre-line">{error}</p>
          <button
            type="button"
            onClick={clearError}
            className="shrink-0 p-0.5 hover:bg-white/20 rounded transition-colors"
            aria-label="Dismiss error"
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
      )}

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        isOpen={deleteTarget !== null}
        pdfTitle={deleteTarget?.title ?? ""}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Bulk delete confirmation dialog */}
      <BulkDeleteConfirmDialog
        isOpen={bulkDeleteOpen}
        count={selectedIds.size}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </DropZone>
  );
}
