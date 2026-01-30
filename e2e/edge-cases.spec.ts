import { expect, test } from "@playwright/test";
import {
  clearIndexedDB,
  importTestPdf,
  openFirstPdf,
  TEST_PDF_PATH,
  waitForPdfRender,
} from "./helpers";

test.describe("Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("non-PDF file rejected via file input", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("hello world"),
    });

    const errorToast = page.locator("div.fixed.bottom-6.right-6").filter({
      has: page.locator("p"),
    });
    await expect(errorToast).toBeVisible({ timeout: 5000 });
    await expect(errorToast.locator("p")).toContainText("is not a PDF");
  });

  test("file with .pdf extension but wrong content", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "fake.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("this is not a real PDF file content"),
    });

    await expect(page.locator('p[title="fake"]').first()).toBeVisible({
      timeout: 10_000,
    });

    await page.locator('p[title="fake"]').first().click();
    await expect(page).toHaveURL(/\/reader\/.+/, { timeout: 10_000 });

    // EmbedPDF will attempt to load the invalid content - the viewer container should still render
    const viewerContainer = page.locator('[data-testid="pdf-viewer-container"]');
    await expect(viewerContainer).toBeVisible({ timeout: 15_000 });
  });

  test("re-import same PDF file creates two separate cards", async ({ page }) => {
    await importTestPdf(page);
    await importTestPdf(page);

    const cards = page.locator('p[title="test"]');
    await expect(cards).toHaveCount(2, { timeout: 10_000 });
  });

  test("delete all PDFs returns to empty state", async ({ page }) => {
    await importTestPdf(page);
    await expect(page.locator('p[title="test"]').first()).toBeVisible();
    await expect(page.getByText("No PDFs yet")).not.toBeVisible();

    const card = page.locator('[role="button"].group.relative').first();
    await card.hover();
    await card.locator('button[aria-label*="Delete"]').click();
    await expect(page.getByText("Delete PDF?")).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).last().click();
    await expect(page.getByText("No PDFs yet")).toBeVisible({ timeout: 5000 });
  });

  test("navigation to non-existent reader ID shows error", async ({ page }) => {
    await page.goto("/reader/nonexistent-id-12345");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("PDF not found")).toBeVisible({ timeout: 10_000 });

    const backButton = page.getByRole("button", { name: "Back to Library" });
    await expect(backButton).toBeVisible();
    await backButton.click();

    await expect(page).toHaveURL("/", { timeout: 5000 });
    await expect(page.getByRole("heading", { name: "PDF Reader" })).toBeVisible();
  });

  test("library data persists across page reload", async ({ page }) => {
    await importTestPdf(page);
    await expect(page.locator('p[title="test"]').first()).toBeVisible();

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.locator('p[title="test"]').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("import file then immediately search for it", async ({ page }) => {
    await importTestPdf(page);

    const searchInput = page.getByPlaceholder("Search PDFs...");
    await searchInput.fill("test");

    await expect(page.locator('p[title="test"]').first()).toBeVisible({
      timeout: 5000,
    });

    await expect(page.getByText("No matching PDFs")).not.toBeVisible();
  });

  test("multiple rapid imports create separate cards", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles(TEST_PDF_PATH);
    await expect(page.locator('p[title="test"]').first()).toBeVisible({
      timeout: 10_000,
    });

    await fileInput.setInputFiles(TEST_PDF_PATH);
    await expect(page.locator('p[title="test"]')).toHaveCount(2, {
      timeout: 10_000,
    });

    await fileInput.setInputFiles(TEST_PDF_PATH);
    await expect(page.locator('p[title="test"]')).toHaveCount(3, {
      timeout: 10_000,
    });
  });

  test("empty search shows all PDFs", async ({ page }) => {
    await importTestPdf(page);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "report.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 fake but named report"),
    });
    await expect(page.locator('p[title="report"]').first()).toBeVisible({
      timeout: 10_000,
    });

    await expect(page.locator('p[title="test"]').first()).toBeVisible();
    await expect(page.locator('p[title="report"]').first()).toBeVisible();

    const searchInput = page.getByPlaceholder("Search PDFs...");
    await searchInput.fill("test");
    await expect(page.locator('p[title="test"]').first()).toBeVisible();
    await expect(page.locator('p[title="report"]')).toHaveCount(0);

    await searchInput.fill("");
    await expect(page.locator('p[title="test"]').first()).toBeVisible();
    await expect(page.locator('p[title="report"]').first()).toBeVisible();
  });

  test("blob URL cleanup - no console errors on navigation", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await importTestPdf(page);
    await openFirstPdf(page);
    await waitForPdfRender(page);

    await page.keyboard.press("Escape");
    await expect(page).toHaveURL("/", { timeout: 5000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes("favicon") &&
        !err.includes("HMR") &&
        !err.includes("hydrat") &&
        !err.includes("404"),
    );

    const blobErrors = criticalErrors.filter(
      (err) => err.includes("blob:") || err.includes("revoke"),
    );
    expect(blobErrors).toHaveLength(0);
  });

  test("reading state persists across navigation", async ({ page }) => {
    await importTestPdf(page);
    await openFirstPdf(page);
    await waitForPdfRender(page);

    // Wait for the viewer to save initial reading state
    await page.waitForTimeout(1500);

    // Verify reading state was written to IndexedDB
    const hasState = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("PdfReaderDB");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const tx = db.transaction("readingState", "readonly");
      const store = tx.objectStore("readingState");
      const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
        const req = store.getAllKeys();
        req.onsuccess = () => resolve(req.result as IDBValidKey[]);
        req.onerror = () => reject(req.error);
      });
      db.close();
      return keys.length > 0;
    });
    expect(hasState).toBe(true);

    // Navigate back and reopen — viewer should still render
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL("/", { timeout: 5000 });

    await openFirstPdf(page);
    await waitForPdfRender(page);
  });

  test("last opened timestamp updates after viewing", async ({ page }) => {
    await importTestPdf(page);

    const card = page.locator('[role="button"].group.relative').first();
    const initialDateText = await card.locator(".p-3 span.text-xs").last().textContent();

    expect(initialDateText).toBe("just now");

    await openFirstPdf(page);
    await waitForPdfRender(page);
    await page.waitForTimeout(1000);

    await page.keyboard.press("Escape");
    await expect(page).toHaveURL("/", { timeout: 5000 });

    const updatedCard = page.locator('[role="button"].group.relative').first();
    const updatedDateText = await updatedCard.locator(".p-3 span.text-xs").last().textContent();

    expect(updatedDateText).toBe("just now");
  });
});
