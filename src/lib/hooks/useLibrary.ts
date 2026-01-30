"use client";

import { liveQuery } from "dexie";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deletePdf,
  deletePdfs,
  getAllPdfMetadataSorted,
  renamePdf,
  toggleStarred,
} from "@/lib/db/pdf-store";
import { importPdfFile } from "@/lib/pdf-import";
import type { PdfMetadata, SortField, SortOrder } from "@/types";

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function useLibrary() {
  const [allPdfs, setAllPdfs] = useState<PdfMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("lastOpenedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);
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
      subscription = liveQuery(() => getAllPdfMetadataSorted(sortField, sortOrder)).subscribe({
        next: (result) => setAllPdfs(result),
        error: (err) => setError(getErrorMessage(err, "Failed to load PDFs")),
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load PDFs"));
    }

    return () => subscription?.unsubscribe();
  }, [sortField, sortOrder]);

  const pdfs = useMemo(() => {
    let filtered = allPdfs;
    if (pendingDeleteIds.length > 0) {
      const pendingSet = new Set(pendingDeleteIds);
      filtered = filtered.filter((p) => !pendingSet.has(p.id));
    }
    if (!searchQuery) return filtered;
    const query = searchQuery.toLowerCase();
    return filtered.filter(
      (pdf) =>
        pdf.title.toLowerCase().includes(query) || pdf.fileName.toLowerCase().includes(query),
    );
  }, [allPdfs, searchQuery, pendingDeleteIds]);

  const importFile = useCallback(async (file: File): Promise<string> => {
    setIsImporting(true);
    setError(null);
    try {
      return await importPdfFile(file);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to import file"));
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
        const message =
          err instanceof Error ? err.message : `Failed to import ${files[i]?.name ?? "file"}`;
        errors.push(message);
      }
    }

    if (!mountedRef.current) return;

    setIsImporting(false);

    if (errors.length > 0) {
      setError(errors.join("\n"));
    }
  }, []);

  const removePdf = useCallback(
    (id: string): void => {
      const pdf = allPdfs.find((p) => p.id === id);
      const title = pdf?.title ?? "PDF";
      setPendingDeleteIds([id]);
      setUndoMessage(`Deleted "${title}"`);
    },
    [allPdfs],
  );

  const removePdfs = useCallback((ids: string[]): void => {
    setPendingDeleteIds(ids);
    setUndoMessage(`Deleted ${ids.length} PDFs`);
  }, []);

  const undoDelete = useCallback(() => {
    setPendingDeleteIds([]);
    setUndoMessage(null);
  }, []);

  const dismissUndo = useCallback(async () => {
    const ids = pendingDeleteIds;
    setPendingDeleteIds([]);
    setUndoMessage(null);
    try {
      if (ids.length === 1) {
        await deletePdf(ids[0]);
      } else if (ids.length > 1) {
        await deletePdfs(ids);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete PDFs"));
    }
  }, [pendingDeleteIds]);

  const handleSortChange = useCallback((field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
  }, []);

  const handleToggleStar = useCallback(async (id: string) => {
    try {
      await toggleStarred(id);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to toggle star"));
    }
  }, []);

  const handleRename = useCallback(async (id: string, title: string) => {
    try {
      await renamePdf(id, title);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to rename PDF"));
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
    sortField,
    sortOrder,
    handleSortChange,
    handleToggleStar,
    handleRename,
    undoMessage,
    undoDelete,
    dismissUndo,
  };
}
