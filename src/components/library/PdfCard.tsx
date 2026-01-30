"use client";

import type { MouseEvent } from "react";
import { useBlobUrl } from "@/lib/hooks/useBlobUrl";
import { formatFileSize, formatRelativeDate, truncateFileName } from "@/lib/utils";
import type { PdfMetadata } from "@/types";

interface PdfCardProps {
  pdf: PdfMetadata;
  onClick: () => void;
  onDelete: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onToggleStar?: () => void;
  onShowDetails?: () => void;
}

export function PdfCard({
  pdf,
  onClick,
  onDelete,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  onToggleStar,
  onShowDetails,
}: PdfCardProps) {
  const thumbnailUrl = useBlobUrl(pdf.thumbnailBlob);

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleShowDetails = (e: MouseEvent) => {
    e.stopPropagation();
    onShowDetails?.();
  };

  const handleToggleStar = (e: MouseEvent) => {
    e.stopPropagation();
    onToggleStar?.();
  };

  const handleClick = () => {
    if (selectionMode && onToggleSelect) {
      onToggleSelect();
    } else {
      onClick();
    }
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: native <button> cannot contain child <button> elements
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`group relative bg-(--color-surface) rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
        selected
          ? "ring-2 ring-(--color-accent) shadow-lg"
          : "hover:shadow-lg hover:-translate-y-0.5"
      }`}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div className="absolute top-2 left-2 z-10">
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              selected
                ? "bg-(--color-accent) border-(--color-accent)"
                : "bg-(--color-surface)/90 border-(--color-text-secondary) backdrop-blur-sm"
            }`}
          >
            {selected && (
              <svg
                aria-hidden="true"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="2,6 5,9 10,3" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Star button (visible on hover or when starred, hidden in selection mode) */}
      {!selectionMode && (
        <button
          type="button"
          onClick={handleToggleStar}
          className={`absolute top-2 left-2 z-10 p-1.5 rounded-lg bg-(--color-surface)/90 backdrop-blur-sm transition-opacity hover:text-amber-400 ${
            pdf.starred
              ? "text-amber-400"
              : "text-(--color-text-secondary) opacity-0 group-hover:opacity-100"
          }`}
          aria-label={pdf.starred ? `Unstar ${pdf.title}` : `Star ${pdf.title}`}
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill={pdf.starred ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={pdf.starred ? "1" : "1.2"}
          >
            <path d="M8 1l2.2 4.4L15 6.3l-3.5 3.4.8 4.9L8 12.3l-4.3 2.3.8-4.9L1 6.3l4.8-.9L8 1z" />
          </svg>
        </button>
      )}

      {/* Info and delete buttons (visible on hover, hidden in selection mode) */}
      {!selectionMode && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          <button
            type="button"
            onClick={handleShowDetails}
            className="p-1.5 rounded-lg bg-(--color-surface)/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-(--color-accent) hover:text-white text-(--color-text-secondary)"
            aria-label={`Details for ${pdf.title}`}
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
              <circle cx="7" cy="7" r="6" />
              <line x1="7" y1="6.5" x2="7" y2="10" />
              <circle cx="7" cy="4.5" r="0.5" fill="currentColor" stroke="none" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 rounded-lg bg-(--color-surface)/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-(--color-danger) hover:text-white text-(--color-text-secondary)"
            aria-label={`Delete ${pdf.title}`}
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

      {/* Thumbnail area */}
      <div className="aspect-[3/4] bg-(--color-surface-hover) flex items-center justify-center overflow-hidden">
        {thumbnailUrl ? (
          // biome-ignore lint/performance/noImgElement: blob URL thumbnails are not compatible with next/image
          <img
            src={thumbnailUrl}
            alt={`Thumbnail for ${pdf.title}`}
            className="w-full h-full object-cover"
          />
        ) : (
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
        )}
      </div>

      {/* Metadata */}
      <div className="p-3">
        <p className="text-sm font-medium text-(--color-foreground) truncate" title={pdf.title}>
          {truncateFileName(pdf.title, 30)}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-(--color-text-secondary)">
            {formatFileSize(pdf.fileSizeBytes)}
          </span>
          <span className="text-xs text-(--color-text-secondary)">
            {formatRelativeDate(pdf.lastOpenedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
