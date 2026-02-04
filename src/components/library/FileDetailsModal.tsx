"use client";

import { useBlobUrl } from "@/lib/hooks/useBlobUrl";
import { useDialog } from "@/lib/hooks/useDialog";
import { formatFileSize, formatRelativeDate } from "@/lib/utils";
import type { PdfMetadata } from "@/types";

interface FileDetailsModalProps {
  isOpen: boolean;
  pdf: PdfMetadata | null;
  onClose: () => void;
  onOpen: () => void;
}

export function FileDetailsModal({ isOpen, pdf, onClose, onOpen }: FileDetailsModalProps) {
  const { dialogRef, handleDialogClick, handleCancel } = useDialog(isOpen, onClose);
  const thumbnailUrl = useBlobUrl(pdf?.thumbnailBlob);

  const displayTitle = pdf?.customTitle || pdf?.title || "";

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      onCancel={handleCancel}
      className="bg-(--color-surface) text-(--color-foreground) rounded-xl p-0 max-w-md w-full shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      {pdf && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-(--color-border)">
            <h3 className="text-responsive-lg font-semibold truncate">{displayTitle}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 sm:p-1.5 min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 rounded-lg hover:bg-(--color-surface-hover) text-(--color-text-secondary) transition-colors"
              aria-label="Close"
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

          {/* Thumbnail */}
          <div className="p-3 sm:p-4 flex justify-center">
            <div className="aspect-[3/4] bg-(--color-surface-hover) rounded-lg overflow-hidden max-h-40 sm:max-h-48 w-auto">
              {thumbnailUrl ? (
                // biome-ignore lint/performance/noImgElement: blob URL thumbnails are not compatible with next/image
                <img
                  src={thumbnailUrl}
                  alt={`Thumbnail for ${displayTitle}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <svg
                    aria-hidden="true"
                    width="40"
                    height="40"
                    viewBox="0 0 40 40"
                    fill="none"
                    stroke="var(--color-text-secondary)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-40"
                  >
                    <rect x="8" y="4" width="24" height="32" rx="2" />
                    <polyline points="22,4 22,14 32,14" />
                    <line x1="22" y1="4" x2="32" y2="14" />
                    <line x1="14" y1="20" x2="26" y2="20" />
                    <line x1="14" y1="25" x2="26" y2="25" />
                    <line x1="14" y1="30" x2="22" y2="30" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Metadata grid */}
          <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 sm:gap-y-2">
            <div>
              <p className="text-xs text-(--color-text-secondary) uppercase tracking-wide">
                File name
              </p>
              <p className="text-sm text-(--color-foreground)">{pdf.fileName}</p>
            </div>
            <div>
              <p className="text-xs text-(--color-text-secondary) uppercase tracking-wide">Pages</p>
              <p className="text-sm text-(--color-foreground)">
                {pdf.pageCount === 0 ? "Unknown" : pdf.pageCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-(--color-text-secondary) uppercase tracking-wide">Size</p>
              <p className="text-sm text-(--color-foreground)">
                {formatFileSize(pdf.fileSizeBytes)}
              </p>
            </div>
            <div>
              <p className="text-xs text-(--color-text-secondary) uppercase tracking-wide">Added</p>
              <p className="text-sm text-(--color-foreground)">
                {new Date(pdf.addedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-(--color-text-secondary) uppercase tracking-wide">
                Last opened
              </p>
              <p className="text-sm text-(--color-foreground)">
                {formatRelativeDate(pdf.lastOpenedAt)}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 sm:gap-3 p-3 sm:p-4 border-t border-(--color-border)">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-(--color-surface-hover) text-(--color-foreground) hover:bg-(--color-border) transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onOpen}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors"
            >
              Open PDF
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
