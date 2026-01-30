import { expect, test } from "@playwright/test";
import { clearIndexedDB, importTestPdf, openFirstPdf, waitForPdfRender } from "./helpers";

// Read the current page number from EmbedPDF's shadow DOM.
// The last text input inside the viewer is the page number field.
async function getViewerPage(page: import("@playwright/test").Page): Promise<number | null> {
  return page.evaluate(() => {
    const embed = document.querySelector("embedpdf-container");
    if (!embed?.shadowRoot) return null;
    const inputs = Array.from(embed.shadowRoot.querySelectorAll<HTMLInputElement>('input[type="text"]'));
    if (inputs.length < 2) return null;
    const val = parseInt(inputs[inputs.length - 1].value, 10);
    return val > 0 ? val : null;
  });
}

test.describe("Reading State Restore", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("pre-written IndexedDB state is restored on open", async ({ page }) => {
    await importTestPdf(page);

    const pdfId = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("PdfReaderDB");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const tx = db.transaction("pdfMetadata", "readonly");
      const all = await new Promise<any[]>((resolve, reject) => {
        const req = tx.objectStore("pdfMetadata").getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      db.close();
      return all[0]?.id as string;
    });

    await page.evaluate(
      async ({ id }) => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const req = indexedDB.open("PdfReaderDB");
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        const tx = db.transaction("readingState", "readwrite");
        tx.objectStore("readingState").put({
          pdfId: id,
          currentPage: 3,
          totalPages: 0,
          zoomLevel: 0,
          updatedAt: Date.now(),
        });
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        db.close();
      },
      { id: pdfId },
    );

    await openFirstPdf(page);
    await waitForPdfRender(page);
    await page.waitForTimeout(2000);

    expect(await getViewerPage(page)).toBe(3);
  });

  test("scroll position persists across back navigation and reopen", async ({ page }) => {
    await importTestPdf(page);
    await openFirstPdf(page);
    await waitForPdfRender(page);
    await page.waitForTimeout(1000);

    expect(await getViewerPage(page)).toBe(1);

    // Scroll down past page 1
    const container = page.locator('[data-testid="pdf-viewer-container"]');
    const box = await container.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    }
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(1500);

    const afterScrollPage = await getViewerPage(page);
    expect(afterScrollPage).toBeGreaterThan(1);

    // Navigate back to library
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL("/", { timeout: 5000 });
    await page.waitForTimeout(1000);

    // Verify state persisted in IndexedDB
    const savedState = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("PdfReaderDB");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const tx = db.transaction("readingState", "readonly");
      const all = await new Promise<any[]>((resolve, reject) => {
        const req = tx.objectStore("readingState").getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      db.close();
      return all[0] ?? null;
    });
    expect(savedState?.currentPage).toBeGreaterThan(1);

    // Reopen and verify page is restored
    await openFirstPdf(page);
    await waitForPdfRender(page);
    await page.waitForTimeout(2000);

    expect(await getViewerPage(page)).toBeGreaterThan(1);
  });
});
