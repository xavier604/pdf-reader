"use client";

import { useEffect, useRef, useState } from "react";
import type { SortField, SortOrder } from "@/types";

interface SortMenuProps {
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
}

const SORT_LABELS: Record<SortField, string> = {
  lastOpenedAt: "Last opened",
  addedAt: "Date added",
  title: "Title",
  fileSize: "Size",
};

const DEFAULT_ORDERS: Record<SortField, SortOrder> = {
  lastOpenedAt: "desc",
  addedAt: "desc",
  title: "asc",
  fileSize: "desc",
};

const SORT_FIELDS = Object.keys(SORT_LABELS) as SortField[];

export function SortMenu({ sortField, sortOrder, onSortChange }: SortMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside or Escape key
  useEffect(() => {
    if (!open) return;

    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleOptionClick(field: SortField) {
    if (field === sortField) {
      onSortChange(field, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSortChange(field, DEFAULT_ORDERS[field]);
    }
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        className="px-3 py-2 text-sm font-medium rounded-lg bg-(--color-surface-hover) text-(--color-foreground) hover:bg-(--color-border) transition-colors flex items-center gap-1.5"
      >
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6l4-4 4 4" />
          <path d="M4 10l4 4 4-4" />
        </svg>
        {SORT_LABELS[sortField]}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 bg-(--color-surface) border border-(--color-border) rounded-lg shadow-lg z-30 py-1 min-w-[160px]"
        >
          {SORT_FIELDS.map((field) => {
            const isActive = field === sortField;
            return (
              <button
                key={field}
                type="button"
                role="menuitem"
                onClick={() => handleOptionClick(field)}
                className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-(--color-surface-hover) transition-colors ${
                  isActive ? "text-(--color-accent) font-medium" : "text-(--color-foreground)"
                }`}
              >
                <span>{SORT_LABELS[field]}</span>
                {isActive && (
                  <span className="flex items-center gap-1">
                    <span>{sortOrder === "asc" ? "\u2191" : "\u2193"}</span>
                    <svg
                      aria-hidden="true"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 7.5l3.5 3.5L12 3" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
