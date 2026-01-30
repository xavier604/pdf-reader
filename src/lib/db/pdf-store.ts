import { db } from "@/lib/db/schema";
import type { PdfMetadata, SortField, SortOrder } from "@/types";

export async function addPdf(id: string, blob: Blob, metadata: PdfMetadata): Promise<void> {
  try {
    await db.transaction("rw", [db.pdfFiles, db.pdfMetadata], async () => {
      await db.pdfFiles.add({ id, blob });
      await db.pdfMetadata.add(metadata);
    });
  } catch (error) {
    console.error("addPdf failed:", error);
    throw new Error("Failed to save PDF. Storage may be full or unavailable.");
  }
}

export async function getPdfBlob(id: string): Promise<Blob | undefined> {
  try {
    const record = await db.pdfFiles.get(id);
    return record?.blob;
  } catch (error) {
    console.error("getPdfBlob failed:", error);
    throw new Error("Failed to load PDF file. Database may be unavailable.");
  }
}

export async function getPdfMetadata(id: string): Promise<PdfMetadata | undefined> {
  try {
    return await db.pdfMetadata.get(id);
  } catch (error) {
    console.error("getPdfMetadata failed:", error);
    throw new Error("Failed to load PDF metadata. Database may be unavailable.");
  }
}

export async function getAllPdfMetadata(): Promise<PdfMetadata[]> {
  return getAllPdfMetadataSorted("lastOpenedAt", "desc");
}

export async function updatePdfMetadata(id: string, updates: Partial<PdfMetadata>): Promise<void> {
  try {
    await db.pdfMetadata.update(id, updates);
  } catch (error) {
    console.error("updatePdfMetadata failed:", error);
    throw new Error("Failed to update PDF metadata. Database may be unavailable.");
  }
}

export async function updatePdfBlob(id: string, blob: Blob): Promise<void> {
  try {
    await db.pdfFiles.update(id, { blob });
  } catch (error) {
    console.error("updatePdfBlob failed:", error);
    throw new Error("Failed to update PDF file. Storage may be full or unavailable.");
  }
}

export async function deletePdf(id: string): Promise<void> {
  try {
    await db.transaction("rw", [db.pdfFiles, db.pdfMetadata, db.readingState], async () => {
      await db.pdfFiles.delete(id);
      await db.pdfMetadata.delete(id);
      await db.readingState.delete(id);
    });
  } catch (error) {
    console.error("deletePdf failed:", error);
    throw new Error("Failed to delete PDF. Database may be unavailable.");
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
    console.error("toggleStarred failed:", error);
    throw new Error("Failed to toggle starred status. Database may be unavailable.");
  }
}

export async function renamePdf(id: string, customTitle: string): Promise<void> {
  try {
    await db.pdfMetadata.update(id, { customTitle, title: customTitle });
  } catch (error) {
    console.error("renamePdf failed:", error);
    throw new Error("Failed to rename PDF. Database may be unavailable.");
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
    console.error("getAllPdfMetadataSorted failed:", error);
    throw new Error("Failed to load PDF library. Database may be unavailable.");
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
    console.error("deletePdfs failed:", error);
    throw new Error("Failed to delete PDFs. Database may be unavailable.");
  }
}
