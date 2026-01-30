export interface PdfMetadata {
  id: string;
  fileName: string;
  title: string;
  pageCount: number;
  fileSizeBytes: number;
  addedAt: number;
  lastOpenedAt: number;
  thumbnailBlob: Blob | null;
}

export type ThemePreference = "light" | "dark" | "system";
