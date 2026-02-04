import { db } from "@/lib/db/schema";
import type { PdfMetadata, SortField, SortOrder } from "@/types";

/**
 * Helper to handle database errors consistently.
 * Logs the error with context and throws a user-friendly error message.
 */
function handleDbError(operationName: string, userMessage: string, error: unknown): never {
  console.error(`${operationName} failed:`, error);
  throw new Error(userMessage);
}

export async function addPdf(id: string, blob: Blob, metadata: PdfMetadata): Promise<void> {
  try {
    await db.transaction("rw", [db.pdfFiles, db.pdfMetadata], async () => {
      await db.pdfFiles.add({ id, blob });
      await db.pdfMetadata.add(metadata);
    });
  } catch (error) {
    handleDbError("addPdf", "Failed to save PDF. Storage may be full or unavailable.", error);
  }
}

export async function getPdfBlob(id: string): Promise<Blob | undefined> {
  try {
    const record = await db.pdfFiles.get(id);
    return record?.blob;
  } catch (error) {
    handleDbError("getPdfBlob", "Failed to load PDF file. Database may be unavailable.", error);
  }
}

export async function updatePdfMetadata(id: string, updates: Partial<PdfMetadata>): Promise<void> {
  try {
    await db.pdfMetadata.update(id, updates);
  } catch (error) {
    handleDbError(
      "updatePdfMetadata",
      "Failed to update PDF metadata. Database may be unavailable.",
      error,
    );
  }
}

export async function updatePdfBlob(id: string, blob: Blob): Promise<void> {
  try {
    await db.pdfFiles.update(id, { blob });
  } catch (error) {
    handleDbError(
      "updatePdfBlob",
      "Failed to update PDF file. Storage may be full or unavailable.",
      error,
    );
  }
}

export async function toggleStarred(id: string): Promise<void> {
  try {
    const metadata = await db.pdfMetadata.get(id);
    if (!metadata) {
      throw new Error(`PDF with id "${id}" not found.`);
    }
    const starred = !metadata.starred;
    await db.pdfMetadata.update(id, { starred });
  } catch (error) {
    handleDbError(
      "toggleStarred",
      "Failed to toggle starred status. Database may be unavailable.",
      error,
    );
  }
}

export async function renamePdf(id: string, customTitle: string): Promise<void> {
  try {
    await db.pdfMetadata.update(id, { customTitle, title: customTitle });
  } catch (error) {
    handleDbError("renamePdf", "Failed to rename PDF. Database may be unavailable.", error);
  }
}

export async function getAllPdfMetadataSorted(
  sortBy: SortField,
  sortOrder: SortOrder,
): Promise<PdfMetadata[]> {
  try {
    const items = await db.pdfMetadata.toArray();

    const direction = sortOrder === "desc" ? -1 : 1;
    let fieldCompare: (a: PdfMetadata, b: PdfMetadata) => number;

    if (sortBy === "title") {
      fieldCompare = (a, b) => a.title.localeCompare(b.title) * direction;
    } else if (sortBy === "fileSize") {
      fieldCompare = (a, b) => (a.fileSizeBytes - b.fileSizeBytes) * direction;
    } else {
      fieldCompare = (a, b) => (a[sortBy] - b[sortBy]) * direction;
    }

    // Single stable sort: starred items first, then by field
    items.sort((a, b) => {
      const starDiff = (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
      if (starDiff !== 0) return starDiff;
      return fieldCompare(a, b);
    });

    return items;
  } catch (error) {
    handleDbError(
      "getAllPdfMetadataSorted",
      "Failed to load PDF library. Database may be unavailable.",
      error,
    );
  }
}

export async function deletePdfs(ids: string[]): Promise<void> {
  try {
    await db.transaction("rw", [db.pdfFiles, db.pdfMetadata, db.readingState], async () => {
      await db.pdfFiles.bulkDelete(ids);
      await db.pdfMetadata.bulkDelete(ids);
      await db.readingState.bulkDelete(ids);
    });
  } catch (error) {
    handleDbError("deletePdfs", "Failed to delete PDFs. Database may be unavailable.", error);
  }
}
