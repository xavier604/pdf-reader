"use client";

import { useEffect } from "react";

export function useKeyboard(handlers: Record<string, () => void>): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Skip if the user is typing in an input or textarea
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || target.isContentEditable) {
        return;
      }

      const handler = handlers[event.key];
      if (handler) {
        handler();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlers]);
}
