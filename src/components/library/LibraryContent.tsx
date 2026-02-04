"use client";

import type React from "react";
import { useEffect } from "react";
import { DropZone } from "@/components/library/DropZone";
import { EmptyState } from "@/components/library/EmptyState";
import { FileDetailsModal } from "@/components/library/FileDetailsModal";
import { FileUploadContainer } from "@/components/library/FileUploadContainer";
import { PdfGrid } from "@/components/library/PdfGrid";
import { SearchBar } from "@/components/library/SearchBar";
import { SortMenu } from "@/components/library/SortMenu";
import { StorageIndicator } from "@/components/library/StorageIndicator";
import { KeyboardShortcutsDialog } from "@/components/shared/KeyboardShortcutsDialog";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import type { PdfMetadata, SortField, SortOrder } from "@/types";

interface LibraryContentProps {
  pdfs: PdfMetadata[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  importFiles: (files: File[]) => Promise<void>;
  isImporting: boolean;
  error: string | null;
  clearError: () => void;
  sortField: SortField;
  sortOrder: SortOrder;
  handleSortChange: (field: SortField, order: SortOrder) => void;
  handleToggleStar: (id: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleOpenFileDialog: () => void;
  handlePdfClick: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  handleShowDetails: (id: string) => void;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onEnterSelectionMode: () => void;
  onCancelSelection: () => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  detailsTarget: PdfMetadata | null;
  setDetailsTarget: (target: PdfMetadata | null) => void;
  handleOpenFromDetails: () => void;
  hasNoPdfs: boolean;
  hasNoResults: boolean;
}

export function LibraryContent({
  pdfs,
  searchQuery,
  setSearchQuery,
  importFiles,
  isImporting,
  error,
  clearError,
  sortField,
  sortOrder,
  handleSortChange,
  handleToggleStar,
  fileInputRef,
  handleOpenFileDialog,
  handlePdfClick,
  onDeleteRequest,
  handleShowDetails,
  selectionMode,
  selectedIds,
  onToggleSelect,
  onEnterSelectionMode,
  onCancelSelection,
  shortcutsOpen,
  setShortcutsOpen,
  detailsTarget,
  setDetailsTarget,
  handleOpenFromDetails,
  hasNoPdfs,
  hasNoResults,
}: LibraryContentProps) {
  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || target.isContentEditable) return;

      if (e.key === "Escape" && selectionMode) {
        onCancelSelection();
      }
      if (e.key === "?") {
        setShortcutsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectionMode, onCancelSelection, setShortcutsOpen]);

  return (
    <DropZone onFilesDropped={importFiles} fileInputRef={fileInputRef}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-(--color-background)/95 backdrop-blur-sm border-b border-(--color-border)">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Top row: Title + utility buttons */}
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-responsive-xl font-bold text-(--color-foreground) shrink-0">
                PDF Reader
              </h1>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShortcutsOpen(true)}
                  className="p-2 rounded-lg bg-(--color-surface-hover) text-(--color-foreground) hover:bg-(--color-border) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
                  aria-label="Keyboard shortcuts"
                >
                  <svg
                    aria-hidden="true"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="10" cy="10" r="8" />
                    <path d="M7.5 7.5a2.5 2.5 0 0 1 5 0c0 1.5-2 2-2 3" />
                    <circle cx="10" cy="14" r="0.5" fill="currentColor" />
                  </svg>
                </button>
                <ThemeToggle />
              </div>
            </div>

            {/* Second row: Search + actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 sm:flex-1">
              <div className="flex-1 w-full sm:max-w-md">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <SortMenu
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSortChange={handleSortChange}
                />
                {pdfs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => (selectionMode ? onCancelSelection() : onEnterSelectionMode())}
                    className="px-3 py-2 text-sm font-medium rounded-lg bg-(--color-surface-hover) text-(--color-foreground) hover:bg-(--color-border) transition-colors"
                  >
                    {selectionMode ? "Cancel" : "Select"}
                  </button>
                )}
                <FileUploadContainer
                  onOpenFileDialog={handleOpenFileDialog}
                  isImporting={isImporting}
                  error={error}
                  clearError={clearError}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {hasNoPdfs && <EmptyState onOpenFile={handleOpenFileDialog} />}

        {pdfs.length > 0 && (
          <PdfGrid
            pdfs={pdfs}
            onPdfClick={handlePdfClick}
            onPdfDelete={onDeleteRequest}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onToggleStar={handleToggleStar}
            onShowDetails={handleShowDetails}
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

      {/* Keyboard shortcuts dialog */}
      <KeyboardShortcutsDialog isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* File details modal */}
      <FileDetailsModal
        isOpen={detailsTarget !== null}
        pdf={detailsTarget}
        onClose={() => setDetailsTarget(null)}
        onOpen={handleOpenFromDetails}
      />
    </DropZone>
  );
}
