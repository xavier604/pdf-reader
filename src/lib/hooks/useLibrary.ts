"use client";

import { liveQuery } from "dexie";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deletePdf, deletePdfs, getAllPdfMetadata } from "@/lib/db/pdf-store";
import { importPdfFile } from "@/lib/pdf-import";
import type { PdfMetadata } from "@/types";

export function useLibrary() {
  const [allPdfs, setAllPdfs] = useState<PdfMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Subscribe to live query for reactive updates
  useEffect(() => {
    let subscription: ReturnType<ReturnType<typeof liveQuery>["subscribe"]> | undefined;
    try {
      subscription = liveQuery(() => getAllPdfMetadata()).subscribe({
        next: (result) => setAllPdfs(result),
        error: (err) => {
          const message = err instanceof Error ? err.message : "Failed to load PDFs";
          setError(message);
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load PDFs";
      setError(message);
    }

    return () => subscription?.unsubscribe();
  }, []);

  const pdfs = useMemo(() => {
    if (!searchQuery) return allPdfs;
    const query = searchQuery.toLowerCase();
    return allPdfs.filter(
      (pdf) =>
        pdf.title.toLowerCase().includes(query) || pdf.fileName.toLowerCase().includes(query),
    );
  }, [allPdfs, searchQuery]);

  const importFile = useCallback(async (file: File): Promise<string> => {
    setIsImporting(true);
    setError(null);
    try {
      return await importPdfFile(file);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to import file";
      setError(message);
      throw err;
    } finally {
      setIsImporting(false);
    }
  }, []);

  const importFiles = useCallback(async (files: FileList): Promise<void> => {
    setIsImporting(true);
    setError(null);
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      if (!mountedRef.current) break;
      try {
        await importPdfFile(files[i]);
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to import ${files[i].name}`;
        errors.push(message);
      }
    }

    if (!mountedRef.current) return;

    setIsImporting(false);

    if (errors.length > 0) {
      setError(errors.join("\n"));
    }
  }, []);

  const removePdf = useCallback(async (id: string): Promise<void> => {
    try {
      await deletePdf(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete PDF";
      setError(message);
    }
  }, []);

  const removePdfs = useCallback(async (ids: string[]): Promise<void> => {
    try {
      await deletePdfs(ids);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete PDFs";
      setError(message);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    pdfs,
    searchQuery,
    setSearchQuery,
    importFile,
    importFiles,
    removePdf,
    removePdfs,
    isImporting,
    error,
    clearError,
  };
}
