import type { PdfEngine } from "@embedpdf/engines";

const THUMBNAIL_WIDTH = 300;
const JPEG_QUALITY = 0.85;

let enginePromise: Promise<PdfEngine<Blob>> | null = null;

function getEngine(): Promise<PdfEngine<Blob>> {
  if (!enginePromise) {
    enginePromise = (async () => {
      if (typeof WebAssembly === "undefined") {
        throw new Error("WebAssembly is not supported in this browser");
      }
      const { createPdfiumDirectEngine, DEFAULT_PDFIUM_WASM_URL } = await import(
        "@embedpdf/engines"
      );
      return createPdfiumDirectEngine(DEFAULT_PDFIUM_WASM_URL);
    })();
    enginePromise.catch(() => {
      enginePromise = null;
    });
  }
  return enginePromise;
}

export async function generateThumbnailAndPageCount(
  pdfBlob: Blob,
): Promise<{ thumbnail: Blob | null; pageCount: number }> {
  try {
    const engine = await getEngine();
    const content = await pdfBlob.arrayBuffer();

    const doc = await engine.openDocumentBuffer({ id: crypto.randomUUID(), content }).toPromise();

    try {
      const pageCount = doc.pageCount;
      const firstPage = doc.pages[0];
      if (!firstPage) {
        return { thumbnail: null, pageCount };
      }

      const scaleFactor = THUMBNAIL_WIDTH / firstPage.size.width;

      const thumbnail = await engine
        .renderThumbnail(doc, firstPage, {
          scaleFactor,
          imageType: "image/jpeg",
          imageQuality: JPEG_QUALITY,
        })
        .toPromise();

      return { thumbnail, pageCount };
    } finally {
      await engine.closeDocument(doc).toPromise();
    }
  } catch {
    return { thumbnail: null, pageCount: 0 };
  }
}
