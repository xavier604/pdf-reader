import { describe, expect, it, vi } from "vitest";

vi.mock("uuid", () => ({ v4: () => "test-uuid-1234" }));
vi.mock("@/lib/db/pdf-store", () => ({
  addPdf: vi.fn().mockResolvedValue(undefined),
  updatePdfMetadata: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/thumbnail-generator", () => ({
  generateThumbnailAndPageCount: vi.fn().mockResolvedValue({ thumbnail: null, pageCount: 0 }),
}));

import { importPdfFile } from "./pdf-import";

function createMockFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(Math.min(size, 8));
  const file = new File([buffer], name, { type });
  if (size > 8) {
    Object.defineProperty(file, "size", { value: size });
  }
  return file;
}

describe("importPdfFile", () => {
  it("rejects non-PDF files", async () => {
    const file = createMockFile("image.png", 1024, "image/png");
    await expect(importPdfFile(file)).rejects.toThrow("not a PDF");
  });

  it("rejects files over 500 MB", async () => {
    const file = createMockFile("huge.pdf", 600 * 1024 * 1024, "application/pdf");
    await expect(importPdfFile(file)).rejects.toThrow("File too large");
  });

  it("accepts valid PDF files", async () => {
    const file = createMockFile("valid.pdf", 1024, "application/pdf");
    const id = await importPdfFile(file);
    expect(id).toBe("test-uuid-1234");
  });

  it("accepts PDF by extension even without MIME type", async () => {
    const file = createMockFile("document.pdf", 2048, "");
    const id = await importPdfFile(file);
    expect(id).toBe("test-uuid-1234");
  });
});
