import { db } from "@/lib/db/schema";
import type { PdfMetadata } from "@/types";

export async function addPdf(id: string, blob: Blob, metadata: PdfMetadata): Promise<void> {
  await db.transaction("rw", [db.pdfFiles, db.pdfMetadata], async () => {
    await db.pdfFiles.add({ id, blob });
    await db.pdfMetadata.add(metadata);
  });
}

export async function getPdfBlob(id: string): Promise<Blob | undefined> {
  const record = await db.pdfFiles.get(id);
  return record?.blob;
}

export async function getPdfMetadata(id: string): Promise<PdfMetadata | undefined> {
  return db.pdfMetadata.get(id);
}

export async function getAllPdfMetadata(): Promise<PdfMetadata[]> {
  return db.pdfMetadata.orderBy("lastOpenedAt").reverse().toArray();
}

export async function updatePdfMetadata(id: string, updates: Partial<PdfMetadata>): Promise<void> {
  await db.pdfMetadata.update(id, updates);
}

export async function updatePdfBlob(id: string, blob: Blob): Promise<void> {
  await db.pdfFiles.update(id, { blob });
}

export async function deletePdf(id: string): Promise<void> {
  await db.transaction("rw", [db.pdfFiles, db.pdfMetadata, db.readingState], async () => {
    await db.pdfFiles.delete(id);
    await db.pdfMetadata.delete(id);
    await db.readingState.delete(id);
  });
}

export async function deletePdfs(ids: string[]): Promise<void> {
  await db.transaction("rw", [db.pdfFiles, db.pdfMetadata, db.readingState], async () => {
    await db.pdfFiles.bulkDelete(ids);
    await db.pdfMetadata.bulkDelete(ids);
    await db.readingState.bulkDelete(ids);
  });
}
