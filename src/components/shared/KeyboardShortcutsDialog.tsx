"use client";

import { useDialog } from "@/lib/hooks/useDialog";

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts: { keys: string[]; action: string }[] = [
  { keys: ["Escape"], action: "Go back / Close dialog" },
  { keys: ["?"], action: "Show keyboard shortcuts" },
  { keys: ["Enter", "Space"], action: "Open selected PDF" },
];

export function KeyboardShortcutsDialog({ isOpen, onClose }: KeyboardShortcutsDialogProps) {
  const { dialogRef, handleDialogClick, handleCancel } = useDialog(isOpen, onClose);

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      onCancel={handleCancel}
      className="bg-(--color-surface) text-(--color-foreground) rounded-xl p-0 max-w-sm w-full shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h3>
        <ul className="space-y-3">
          {shortcuts.map((shortcut) => (
            <li key={shortcut.action} className="flex items-center justify-between gap-4">
              <span className="text-sm text-(--color-text-secondary)">{shortcut.action}</span>
              <span className="flex items-center gap-1.5 shrink-0">
                {shortcut.keys.map((key, i) => (
                  <span key={key} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-xs text-(--color-text-secondary)">or</span>}
                    <kbd className="px-1.5 py-0.5 text-xs font-mono bg-(--color-surface-hover) border border-(--color-border) rounded">
                      {key}
                    </kbd>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end px-4 sm:px-6 pb-4 sm:pb-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-(--color-surface-hover) text-(--color-foreground) hover:bg-(--color-border) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
        >
          Close
        </button>
      </div>
    </dialog>
  );
}
