"use client";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  onCancel,
  onDelete,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-18.25 z-10 bg-(--color-surface) border-b border-(--color-border) px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-(--color-foreground)">
            {selectedCount} selected
          </span>
          <button
            type="button"
            onClick={onToggleAll}
            className="text-sm text-(--color-accent) hover:text-(--color-accent-hover) transition-colors"
          >
            {allSelected ? "Deselect all" : `Select all (${totalCount})`}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm rounded-lg bg-(--color-surface-hover) text-(--color-foreground) hover:bg-(--color-border) transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-(--color-danger) text-white hover:bg-(--color-danger-hover) transition-colors"
          >
            Delete ({selectedCount})
          </button>
        </div>
      </div>
    </div>
  );
}
