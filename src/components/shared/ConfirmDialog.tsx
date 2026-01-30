"use client";

import type React from "react";
import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isOpen]);

  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const rect = dialog.getBoundingClientRect();
    const isClickOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;

    if (isClickOutside) {
      onCancel();
    }
  };

  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
      onCancel={handleCancel}
      className="bg-(--color-surface) text-(--color-foreground) rounded-xl p-0 max-w-sm w-full shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-(--color-text-secondary) text-sm">{description}</p>
      </div>

      <div className="flex justify-end gap-3 px-6 pb-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-(--color-surface-hover) text-(--color-foreground) hover:bg-(--color-border) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-(--color-danger) text-white hover:bg-(--color-danger-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-danger)"
        >
          Delete
        </button>
      </div>
    </dialog>
  );
}
