import Dexie, { type EntityTable } from "dexie";
import type { PdfMetadata } from "@/types";

interface PdfFile {
  id: string;
  blob: Blob;
}

interface ReadingStateRecord {
  pdfId: string;
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  updatedAt: number;
}

class PdfReaderDB extends Dexie {
  pdfFiles!: EntityTable<PdfFile, "id">;
  pdfMetadata!: EntityTable<PdfMetadata, "id">;
  readingState!: EntityTable<ReadingStateRecord, "pdfId">;

  constructor() {
    super("PdfReaderDB");

    this.version(2).stores({
      pdfFiles: "id",
      pdfMetadata: "id, fileName, addedAt, lastOpenedAt",
      readingState: "pdfId",
    });
  }
}

export const db = new PdfReaderDB();
