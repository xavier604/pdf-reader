"use client";

import { PDFViewer } from "@embedpdf/react-pdf-viewer";
import { useCallback, useEffect, useRef } from "react";
import { updatePdfBlob } from "@/lib/db/pdf-store";
import { getReadingState, saveReadingState } from "@/lib/db/reading-state-store";

interface PdfViewerWrapperProps {
  pdfId: string;
  blobUrl: string;
  theme: "light" | "dark";
}

export function PdfViewerWrapper({ pdfId, blobUrl, theme }: PdfViewerWrapperProps) {
  const registryRef = useRef<any>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredRef = useRef(false);
  const unsubscribesRef = useRef<Array<() => void>>([]);
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
    [pdfId, debouncedSaveState],
  );

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
    <div className="h-full w-full" data-testid="pdf-viewer-container">
      <PDFViewer
        config={{
          src: blobUrl,
          theme: { preference: theme },
        }}
        style={{ width: "100%", height: "100%" }}
        onReady={handleReady}
      />
    </div>
  );
}
