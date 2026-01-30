import { db } from "@/lib/db/schema";
import type { PdfMetadata } from "@/types";

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
  try {
    return await db.pdfMetadata.orderBy("lastOpenedAt").reverse().toArray();
  } catch (error) {
    console.error("getAllPdfMetadata failed:", error);
    throw new Error("Failed to load PDF library. Database may be unavailable.");
  }
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
