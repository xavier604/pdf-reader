"use client";

import { useEffect, useRef, useState } from "react";
import { getPdfBlob, updatePdfMetadata } from "@/lib/db/pdf-store";

interface UsePdfLoaderResult {
  blobUrl: string | null;
  loading: boolean;
  error: string | null;
}

export function usePdfLoader(pdfId: string): UsePdfLoaderResult {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(null);

      try {
        const blob = await getPdfBlob(pdfId);

        if (cancelled) return;

        if (!blob) {
          setError("PDF not found");
          return;
        }

        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;

        if (cancelled) {
          URL.revokeObjectURL(url);
          blobUrlRef.current = null;
          return;
        }

        setBlobUrl(url);

        // Update last opened timestamp (non-critical, don't surface as load error)
        updatePdfMetadata(pdfId, { lastOpenedAt: Date.now() }).catch(() => {});
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load PDF");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [pdfId]);

  return { blobUrl, loading, error };
}
