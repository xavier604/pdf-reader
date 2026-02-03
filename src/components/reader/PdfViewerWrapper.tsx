"use client";

import { PDFViewer } from "@embedpdf/react-pdf-viewer";
import { useCallback, useEffect, useRef } from "react";
import { updatePdfBlob } from "@/lib/db/pdf-store";
import { getReadingState, saveReadingState } from "@/lib/db/reading-state-store";

interface PdfViewerWrapperProps {
  pdfId: string;
  blobUrl: string;
  theme: "light" | "dark";
  pdfDarkMode: boolean;
}

// Helper function to apply dark mode filter to PDF content
function applyDarkModeFilter(container: HTMLElement, enabled: boolean): boolean {
  const embedpdf = container.querySelector("embedpdf-container");
  if (!embedpdf) return false;

  // Try to access shadow DOM
  const shadowRoot = (embedpdf as any).shadowRoot;
  if (!shadowRoot) return false;

  // Target the inline-block div that contains actual PDF pages
  // This avoids inverting the bg-bg-app background
  const documentContent = shadowRoot.querySelector("#document-content");
  if (!documentContent) return false;

  // Find the inline-block container that holds the PDF pages
  const pdfContainer = documentContent.querySelector('div[style*="display: inline-block"]');

  if (pdfContainer) {
    if (enabled) {
      // invert(0.96) makes white (#ffffff) → #0a0a0a to match app theme
      (pdfContainer as HTMLElement).style.filter = "invert(0.96)";
      (pdfContainer as HTMLElement).style.transition = "filter 0.2s ease-in-out";
    } else {
      (pdfContainer as HTMLElement).style.filter = "none";
    }
    return true;
  }

  return false;
}

export function PdfViewerWrapper({ pdfId, blobUrl, theme, pdfDarkMode }: PdfViewerWrapperProps) {
  const registryRef = useRef<any>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredRef = useRef(false);
  const unsubscribesRef = useRef<Array<() => void>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedSaveState = useCallback(
    (page: number, zoom: number) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveReadingState(pdfId, { currentPage: page, zoomLevel: zoom });
      }, 500);
    },
    [pdfId],
  );

  const handleReady = useCallback(
    (registry: any) => {
      registryRef.current = registry;

      const zoomCap = registry.getPlugin("zoom")?.provides();
      const scrollCap = registry.getPlugin("scroll")?.provides();

      if (!scrollCap) return;

      // Apply dark mode filter after PDF is ready
      setTimeout(() => {
        if (containerRef.current && pdfDarkMode) {
          applyDarkModeFilter(containerRef.current, pdfDarkMode);
        }
      }, 500);

      // Restore saved state once the initial layout is ready (per EmbedPDF docs).
      // The IndexedDB read MUST happen inside the handler because on repeat visits
      // the WASM engine is cached and onLayoutReady can fire before useEffect runs.
      // scrollToPage works any time after layout is ready, not just synchronously.
      const unsubLayout = scrollCap.onLayoutReady((event: any) => {
        if (!event.isInitial || restoredRef.current) return;
        restoredRef.current = true;

        const documentId = event.documentId;
        getReadingState(pdfId).then((saved: any) => {
          if (!saved) return;

          const docScroll = scrollCap.forDocument(documentId);
          const docZoom = zoomCap?.forDocument(documentId);

          if (saved.zoomLevel && saved.zoomLevel > 0) {
            // Restore zoom first. The zoom change triggers a re-layout, so we
            // must wait for it to settle before scrolling to the saved page.
            const unsub = zoomCap?.onZoomChange(() => {
              unsub?.();
              if (saved.currentPage > 1) {
                docScroll?.scrollToPage({
                  pageNumber: saved.currentPage,
                  behavior: "instant",
                });
              }
            });
            docZoom?.requestZoom(saved.zoomLevel);
          } else if (saved.currentPage > 1) {
            // No zoom to restore — scroll immediately
            docScroll?.scrollToPage({
              pageNumber: saved.currentPage,
              behavior: "instant",
            });
          }
        });
      });
      unsubscribesRef.current.push(unsubLayout);

      // Persist zoom changes
      const unsubZoom = zoomCap?.onZoomChange((event: any) => {
        const currentPage = scrollCap.getCurrentPage() ?? 1;
        debouncedSaveState(currentPage, event.newZoom);
      });
      if (unsubZoom) unsubscribesRef.current.push(unsubZoom);

      // Persist page changes
      const unsubPage = scrollCap.onPageChange((event: any) => {
        const zoomState = zoomCap?.getState();
        debouncedSaveState(event.pageNumber, zoomState?.currentZoomLevel ?? 1);
      });
      unsubscribesRef.current.push(unsubPage);
    },
    [pdfId, debouncedSaveState, pdfDarkMode],
  );

  // Apply dark mode filter to canvas elements only
  useEffect(() => {
    if (!containerRef.current) return;

    let retryCount = 0;
    const maxRetries = 15;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tryApply = () => {
      if (!containerRef.current) return;

      const success = applyDarkModeFilter(containerRef.current, pdfDarkMode);

      if (!success && retryCount < maxRetries) {
        retryCount++;
        timeoutId = setTimeout(tryApply, 200);
      }
    };

    // Try to apply with retries
    tryApply();

    // Also observe for new canvases being added (for multi-page rendering)
    const observer = new MutationObserver(() => {
      if (containerRef.current) {
        applyDarkModeFilter(containerRef.current, pdfDarkMode);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [pdfDarkMode]);

  // Save annotations on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      for (const unsub of unsubscribesRef.current) {
        unsub();
      }
      unsubscribesRef.current = [];

      const registry = registryRef.current;
      if (!registry || registry.isDestroyed()) return;

      try {
        // Fire-and-forget: persist PDF with any annotations baked in
        const exportCap = registry.getPlugin("export")?.provides();
        exportCap
          ?.saveAsCopy()
          ?.toPromise()
          ?.then((buffer: ArrayBuffer) => {
            updatePdfBlob(pdfId, new Blob([buffer], { type: "application/pdf" }));
          })
          ?.catch(() => {});
      } catch {
        // Registry may already be torn down — safe to ignore
      }
    };
  }, [pdfId]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      data-testid="pdf-viewer-container"
      data-pdf-dark-mode={pdfDarkMode ? "true" : "false"}
    >
      <PDFViewer
        config={{
          src: blobUrl,
          theme: {
            preference: theme,
            light: {
              background: {
                app: "#ffffff",
                surface: "#f5f5f5",
              },
            },
            dark: {
              background: {
                app: "#0a0a0a",
                surface: "#1a1a1a",
              },
            },
          },
        }}
        style={{ width: "100%", height: "100%" }}
        onReady={handleReady}
      />
    </div>
  );
}
