import { expect, type Page } from "@playwright/test";
import path from "path";

export const TEST_PDF_PATH = path.join(__dirname, "fixtures", "test.pdf");

/**
 * Import a PDF into the library via the hidden file input.
 * Waits for a card with the expected title to appear.
 */
export async function importTestPdf(page: Page, filePath = TEST_PDF_PATH) {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
  // Wait for the card title to appear (title = filename minus .pdf)
  const expectedTitle = path.basename(filePath, ".pdf");
  await expect(page.locator(`p[title="${expectedTitle}"]`).first()).toBeVisible({
    timeout: 10_000,
  });
}

/**
 * Clear all IndexedDB data so tests start fresh.
 */
export async function clearIndexedDB(page: Page) {
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  });
}

/**
 * Wait for the PDF viewer to finish rendering.
 * EmbedPDF renders an <embedpdf-container> web component with canvas elements
 * inside our container div. Waiting for a canvas ensures actual PDF content
 * has been painted, not just the viewer shell.
 */
export async function waitForPdfRender(page: Page) {
  const container = page.locator('[data-testid="pdf-viewer-container"]');
  await container.waitFor({ state: "visible", timeout: 30_000 });
  // Wait for EmbedPDF to render actual PDF content (canvas elements)
  await container.locator("canvas").first().waitFor({ state: "attached", timeout: 30_000 });
}

/**
 * Navigate from library to reader by clicking the first PDF card.
 */
export async function openFirstPdf(page: Page) {
  // Click the card title — click bubbles up to the card div's onClick handler
  await page.locator('p[title="test"]').first().click();
  await expect(page).toHaveURL(/\/reader\/.+/, { timeout: 10_000 });
}
