"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { formatFileSize, formatRelativeDate, truncateFileName } from "@/lib/utils";
import type { PdfMetadata } from "@/types";

interface PdfCardProps {
  pdf: PdfMetadata;
  onClick: () => void;
  onDelete: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export function PdfCard({
  pdf,
  onClick,
  onDelete,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: PdfCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  // Create and revoke object URL for thumbnail
  useEffect(() => {
    if (pdf.thumbnailBlob) {
      const url = URL.createObjectURL(pdf.thumbnailBlob);
      setThumbnailUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setThumbnailUrl(null);
    }
  }, [pdf.thumbnailBlob]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleClick = () => {
    if (selectionMode && onToggleSelect) {
      onToggleSelect();
    } else {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
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

      {/* Delete button (visible on hover, hidden in selection mode) */}
      {!selectionMode && (
        <button
          type="button"
          onClick={handleDelete}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-(--color-surface)/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-(--color-danger) hover:text-white text-(--color-text-secondary)"
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
    </button>
  );
}
