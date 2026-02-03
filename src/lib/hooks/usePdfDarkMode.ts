import { useCallback, useState } from "react";

const STORAGE_KEY = "pdf-reader-pdf-dark-mode";

function getStoredPdfDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "true";
  } catch {
    // localStorage unavailable (e.g. Safari private browsing)
  }
  return false;
}

export function usePdfDarkMode() {
  const [pdfDarkMode, setPdfDarkModeState] = useState<boolean>(getStoredPdfDarkMode);

  const setPdfDarkMode = useCallback((enabled: boolean) => {
    setPdfDarkModeState(enabled);
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
      // localStorage unavailable (e.g. Safari private browsing)
    }
  }, []);

  const togglePdfDarkMode = useCallback(() => {
    setPdfDarkMode(!pdfDarkMode);
  }, [pdfDarkMode, setPdfDarkMode]);

  return { pdfDarkMode, setPdfDarkMode, togglePdfDarkMode };
}
