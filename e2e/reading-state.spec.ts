import { expect, test } from "@playwright/test";
import { clearIndexedDB, importTestPdf, openFirstPdf, waitForPdfRender } from "./helpers";

// Read the current page number from EmbedPDF's shadow DOM.
// The last text input inside the viewer is the page number field.
async function getViewerPage(page: import("@playwright/test").Page): Promise<number | null> {
  return page.evaluate(() => {
    const embed = document.querySelector("embedpdf-container");
    if (!embed?.shadowRoot) return null;
    const inputs = Array.from(
      embed.shadowRoot.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    );
    if (inputs.length < 2) return null;
    const val = parseInt(inputs[inputs.length - 1].value, 10);
    return val > 0 ? val : null;
  });
}

async function getFirstPdfId(page: import("@playwright/test").Page): Promise<string> {
  return page.evaluate(async () => {
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
}

async function seedReadingState(
  page: import("@playwright/test").Page,
  pdfId: string,
  currentPage: number,
): Promise<void> {
  await page.evaluate(
    async ({ id, pageNum }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("PdfReaderDB");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const tx = db.transaction("readingState", "readwrite");
      tx.objectStore("readingState").put({
        pdfId: id,
        currentPage: pageNum,
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
    { id: pdfId, pageNum: currentPage },
  );
}

async function readReadingState(page: import("@playwright/test").Page): Promise<any> {
  return page.evaluate(async () => {
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

    const pdfId = await getFirstPdfId(page);
    await seedReadingState(page, pdfId, 3);

    await openFirstPdf(page);
    await waitForPdfRender(page);
    await page.waitForTimeout(2000);

    expect(await getViewerPage(page)).toBe(3);
  });

  test("reading state persists across back navigation and reopen", async ({ page }) => {
    await importTestPdf(page);

    // Seed reading state (page 3) directly into IndexedDB.
    // Playwright's synthetic scroll/keyboard events don't reliably trigger
    // EmbedPDF's onPageChange callback, so we seed state the same way
    // the app would after a real user scroll.
    const pdfId = await getFirstPdfId(page);
    await seedReadingState(page, pdfId, 3);

    await openFirstPdf(page);
    await waitForPdfRender(page);
    await page.waitForTimeout(2000);
    expect(await getViewerPage(page)).toBe(3);

    await page.keyboard.press("Escape");
    await expect(page).toHaveURL("/", { timeout: 5000 });
    await page.waitForTimeout(1000);

    // Verify the unmount cleanup preserved the restored state (didn't clobber it)
    const savedState = await readReadingState(page);
    expect(savedState?.currentPage).toBe(3);

    await openFirstPdf(page);
    await waitForPdfRender(page);
    await page.waitForTimeout(2000);
    expect(await getViewerPage(page)).toBe(3);
  });
});
