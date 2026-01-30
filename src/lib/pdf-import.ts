import { v4 as uuidv4 } from "uuid";
import { addPdf, updatePdfMetadata } from "@/lib/db/pdf-store";
import { generateThumbnailAndPageCount } from "@/lib/thumbnail-generator";
import type { PdfMetadata } from "@/types";

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

export async function importPdfFile(file: File): Promise<string> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    throw new Error(
      `Invalid file type: "${file.name}" is not a PDF. Please select a file with a .pdf extension.`,
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File too large: "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(0)} MB. Maximum allowed size is 500 MB.`,
    );
  }

  const id = uuidv4();
  const now = Date.now();

  const title = file.name.replace(/\.pdf$/i, "");

  const metadata: PdfMetadata = {
    id,
    fileName: file.name,
    title,
    pageCount: 0,
    fileSizeBytes: file.size,
    addedAt: now,
    lastOpenedAt: now,
    thumbnailBlob: null,
  };

  let blob: Blob;
  try {
    blob = new Blob([await file.arrayBuffer()], {
      type: "application/pdf",
    });
  } catch (err) {
    throw new Error(
      `Failed to read file "${file.name}". The file may have been moved or deleted.`,
      { cause: err },
    );
  }

  await addPdf(id, blob, metadata);

  // Fire-and-forget: generate thumbnail and page count in a single pass
  processPdfMetadata(id, blob).catch((err) => {
    console.error(`[pdf-import] Failed to generate thumbnail/page count for "${id}":`, err);
  });

  return id;
}

async function processPdfMetadata(id: string, blob: Blob): Promise<void> {
  const { thumbnail, pageCount } = await generateThumbnailAndPageCount(blob);

  const updates: Partial<PdfMetadata> = {};
  if (thumbnail) updates.thumbnailBlob = thumbnail;
  if (pageCount > 0) updates.pageCount = pageCount;

  if (Object.keys(updates).length > 0) {
    await updatePdfMetadata(id, updates);
  }
}
