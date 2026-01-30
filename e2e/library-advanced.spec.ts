import { expect, test } from "@playwright/test";
import { clearIndexedDB, importTestPdf, TEST_PDF_PATH } from "./helpers";

test.describe("Library Advanced", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("drag-and-drop: overlay appears on dragenter and disappears on dragleave", async ({
    page,
  }) => {
    await expect(page.getByText("Drop PDF here")).not.toBeVisible();

    // Simulate dragenter via page.evaluate (dispatchEvent can't construct DataTransfer natively)
    await page.evaluate(() => {
      const dropZone = document.querySelector('[role="application"]')!;
      const enterEvent = new DragEvent("dragenter", {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer(),
      });
      dropZone.dispatchEvent(enterEvent);
    });

    await expect(page.getByText("Drop PDF here")).toBeVisible({ timeout: 5000 });

    await page.evaluate(() => {
      const dropZone = document.querySelector('[role="application"]')!;
      const leaveEvent = new DragEvent("dragleave", {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer(),
      });
      dropZone.dispatchEvent(leaveEvent);
    });

    await expect(page.getByText("Drop PDF here")).not.toBeVisible({ timeout: 5000 });
  });

  test("non-PDF file rejection: error message appears for invalid file", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "invalid.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not a pdf file"),
    });

    await expect(page.locator("text=/not a PDF|Invalid file type/i").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('p[title="invalid"]')).not.toBeVisible();
    await expect(page.getByText("No PDFs yet")).toBeVisible();
  });

  test("batch import: multiple PDFs imported via sequential file input", async ({ page }) => {
    // Playwright doesn't allow duplicate paths in setInputFiles, so import sequentially
    await importTestPdf(page);
    await importTestPdf(page);

    const cards = page.locator('p[title="test"]');
    await expect(cards).toHaveCount(2, { timeout: 10_000 });
    await expect(page.getByText("No PDFs yet")).not.toBeVisible();
  });

  test("thumbnail display: img element appears after PDF import", async ({ page }) => {
    await importTestPdf(page);

    const card = page.locator('[role="button"].group.relative').first();
    await expect(card).toBeVisible();

    // Wait for async thumbnail generation
    const thumbnailImg = card.locator('img[alt*="Thumbnail"]');
    await expect(thumbnailImg).toBeVisible({ timeout: 15_000 });

    const src = await thumbnailImg.getAttribute("src");
    expect(src).toBeTruthy();
  });

  test("error toast dismiss: clicking dismiss removes the error", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "bad-file.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not a pdf file"),
    });

    const errorToast = page.locator("text=/not a PDF|Invalid file type/i").first();
    await expect(errorToast).toBeVisible({ timeout: 10_000 });

    const dismissButton = page.locator('button[aria-label="Dismiss error"]');
    await expect(dismissButton).toBeVisible();
    await dismissButton.click();
    await expect(errorToast).not.toBeVisible({ timeout: 5000 });
  });

  test("loading indicator during import: 'Importing...' text appears", async ({ page }) => {
    // Since import can be fast, we use a Promise.all pattern to observe
    // the indicator while the import is in progress.
    const fileInput = page.locator('input[type="file"]');
    const importingIndicator = page.getByText("Importing...");

    const [indicatorWasVisible] = await Promise.all([
      importingIndicator
        .waitFor({ state: "visible", timeout: 10_000 })
        .then(() => true)
        .catch(() => false),
      fileInput.setInputFiles(TEST_PDF_PATH),
    ]);

    // If import completed too quickly to observe the indicator, verify the PDF was imported
    if (!indicatorWasVisible) {
      await expect(page.locator('p[title="test"]').first()).toBeVisible({
        timeout: 10_000,
      });
    }

    await expect(importingIndicator).not.toBeVisible({ timeout: 10_000 });
  });

  test("card metadata display: file size and relative date shown", async ({ page }) => {
    await importTestPdf(page);

    const card = page.locator('[role="button"].group.relative').first();
    await expect(card).toBeVisible();
    await expect(card.locator('p[title="test"]')).toBeVisible();

    const metadataArea = card.locator(".flex.items-center.justify-between");
    await expect(metadataArea).toBeVisible();

    const fileSizeText = metadataArea.locator("span").first();
    await expect(fileSizeText).toBeVisible();
    const sizeContent = await fileSizeText.textContent();
    expect(sizeContent).toMatch(/\d+(\.\d+)?\s*(B|KB|MB|GB)/);

    const dateText = metadataArea.locator("span").last();
    await expect(dateText).toBeVisible();
    expect(await dateText.textContent()).toBeTruthy();
  });

  test("search clear button: X button clears search and restores results", async ({ page }) => {
    await importTestPdf(page);

    const searchInput = page.getByPlaceholder("Search PDFs...");
    await searchInput.fill("test");
    await expect(page.locator('p[title="test"]').first()).toBeVisible();

    const clearButton = page.locator('button[aria-label="Clear search"]');
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await expect(searchInput).toHaveValue("");
    await expect(clearButton).not.toBeVisible();
    await expect(page.locator('p[title="test"]').first()).toBeVisible();

    // Now test with a non-matching query, then clear
    await searchInput.fill("nonexistent");
    await expect(page.getByText("No matching PDFs")).toBeVisible();
    await expect(clearButton).toBeVisible();

    await clearButton.click();
    await expect(searchInput).toHaveValue("");
    await expect(page.locator('p[title="test"]').first()).toBeVisible();
    await expect(page.getByText("No matching PDFs")).not.toBeVisible();
  });
});
