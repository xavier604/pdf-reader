export interface PdfMetadata {
  id: string;
  fileName: string;
  title: string;
  pageCount: number;
  fileSizeBytes: number;
  addedAt: number;
  lastOpenedAt: number;
  thumbnailBlob: Blob | null;
  starred: boolean;
  customTitle: string | null;
}

export type SortField = "lastOpenedAt" | "addedAt" | "title" | "fileSize";
export type SortOrder = "asc" | "desc";

export type ThemePreference = "light" | "dark" | "system";
