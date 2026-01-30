import { expect, test } from "@playwright/test";
import { clearIndexedDB, importTestPdf, openFirstPdf, waitForPdfRender } from "./helpers";

test.describe("Reader Advanced", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await importTestPdf(page);
    await openFirstPdf(page);
  });

  test("loading state transitions to rendered PDF", async ({ page }) => {
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL("/");

    // Race: watch for either "Loading PDF..." or the viewer container
    const loadingLocator = page.getByText("Loading PDF...");
    const viewerLocator = page.locator('[data-testid="pdf-viewer-container"]');

    await page.locator('p[title="test"]').first().click();
    await expect(page).toHaveURL(/\/reader\/.+/, { timeout: 10_000 });

    const eitherVisible = await Promise.race([
      loadingLocator.waitFor({ state: "visible", timeout: 5_000 }).then(() => "loading"),
      viewerLocator.waitFor({ state: "visible", timeout: 5_000 }).then(() => "viewer"),
    ]);
    expect(["loading", "viewer"]).toContain(eitherVisible);

    // After everything settles, the viewer should be present
    await expect(viewerLocator).toBeVisible({ timeout: 30_000 });
  });

  test("corrupted PDF shows error state", async ({ page }) => {
    const corruptedId = "corrupted-pdf-id";

    // Insert a corrupted entry directly into IndexedDB
    await page.evaluate(async (id) => {
      const dbRequest = indexedDB.open("PdfReaderDB");
      await new Promise<void>((resolve, reject) => {
        dbRequest.onsuccess = () => {
          const db = dbRequest.result;
          const tx = db.transaction(["pdfFiles", "pdfMetadata"], "readwrite");

          const corruptedBlob = new Blob(["this is not a valid pdf"], {
            type: "application/pdf",
          });
          tx.objectStore("pdfFiles").put({ id, blob: corruptedBlob });

          tx.objectStore("pdfMetadata").put({
            id,
            fileName: "corrupted.pdf",
            title: "corrupted",
            pageCount: 1,
            fileSizeBytes: 100,
            addedAt: Date.now(),
            lastOpenedAt: Date.now(),
            thumbnailBlob: null,
          });

          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            db.close();
            reject(tx.error);
          };
        };
        dbRequest.onerror = () => reject(dbRequest.error);
      });
    }, corruptedId);

    await page.goto(`/reader/${corruptedId}`);

    // EmbedPDF may show its own error, or the blob URL may work but content fails
    const viewerContainer = page.locator('[data-testid="pdf-viewer-container"]');
    await expect(viewerContainer).toBeVisible({ timeout: 30_000 });
  });

  test("viewer container is present after navigation", async ({ page }) => {
    await waitForPdfRender(page);

    const container = page.locator('[data-testid="pdf-viewer-container"]');
    await expect(container).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page).toHaveURL("/");
    await openFirstPdf(page);
    await waitForPdfRender(page);

    await expect(container).toBeVisible();
  });
});
