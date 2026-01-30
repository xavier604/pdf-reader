"use client";

import { type MouseEvent, type SyntheticEvent, useEffect, useRef } from "react";

export function useDialog(isOpen: boolean, onClose: () => void) {
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

  const handleDialogClick = (e: MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isClickOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
    if (isClickOutside) onClose();
  };

  const handleCancel = (e: SyntheticEvent) => {
    e.preventDefault();
    onClose();
  };

  return { dialogRef, handleDialogClick, handleCancel };
}
