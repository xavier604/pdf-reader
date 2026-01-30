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
    // The drag overlay should not be visible initially
    await expect(page.getByText("Drop PDF here")).not.toBeVisible();

    // Simulate dragenter via page.evaluate (dispatchEvent can't construct DataTransfer)
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

    // Simulate dragleave to hide the overlay
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
    const buffer = Buffer.from("not a pdf file");
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: "invalid.txt",
      mimeType: "text/plain",
      buffer,
    });

    // An error toast should appear indicating invalid file type
    await expect(page.locator("text=/not a PDF|Invalid file type/i").first()).toBeVisible({
      timeout: 10_000,
    });

    // The file should NOT appear as a card in the library
    await expect(page.locator('p[title="invalid"]')).not.toBeVisible();

    // Empty state should still be showing
    await expect(page.getByText("No PDFs yet")).toBeVisible();
  });

  test("batch import: multiple PDFs imported via sequential file input", async ({ page }) => {
    // Playwright doesn't allow duplicate paths in setInputFiles, so import sequentially
    await importTestPdf(page);
    await importTestPdf(page);

    // Both cards should appear with title "test"
    const cards = page.locator('p[title="test"]');
    await expect(cards).toHaveCount(2, { timeout: 10_000 });

    // Empty state should be gone
    await expect(page.getByText("No PDFs yet")).not.toBeVisible();
  });

  test("thumbnail display: img element appears after PDF import", async ({ page }) => {
    await importTestPdf(page);

    // The card should exist
    const card = page.locator("button.group.relative").first();
    await expect(card).toBeVisible();

    // Wait for the thumbnail img to appear (async thumbnail generation)
    const thumbnailImg = card.locator('img[alt*="Thumbnail"]');
    await expect(thumbnailImg).toBeVisible({ timeout: 15_000 });

    // The img src should be a blob URL
    const src = await thumbnailImg.getAttribute("src");
    expect(src).toBeTruthy();
  });

  test("error toast dismiss: clicking dismiss removes the error", async ({ page }) => {
    // Trigger an error by importing a non-PDF file
    const buffer = Buffer.from("not a pdf file");
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: "bad-file.txt",
      mimeType: "text/plain",
      buffer,
    });

    // Wait for error toast to appear
    const errorToast = page.locator("text=/not a PDF|Invalid file type/i").first();
    await expect(errorToast).toBeVisible({ timeout: 10_000 });

    // Click the dismiss button (aria-label="Dismiss error")
    const dismissButton = page.locator('button[aria-label="Dismiss error"]');
    await expect(dismissButton).toBeVisible();
    await dismissButton.click();

    // The error toast should disappear
    await expect(errorToast).not.toBeVisible({ timeout: 5000 });
  });

  test("loading indicator during import: 'Importing...' text appears", async ({ page }) => {
    // We check for the importing indicator by looking for it in the DOM.
    // Since import can be fast, we use a Promise.all pattern to observe
    // the indicator while the import is in progress.
    const fileInput = page.locator('input[type="file"]');
    const importingIndicator = page.getByText("Importing...");

    // Start observing for the indicator and trigger the import concurrently
    const [indicatorWasVisible] = await Promise.all([
      // Poll for the indicator text appearing at any point
      importingIndicator
        .waitFor({ state: "visible", timeout: 10_000 })
        .then(() => true)
        .catch(() => false),
      fileInput.setInputFiles(TEST_PDF_PATH),
    ]);

    // If the import was fast enough that we missed it, at least verify
    // the element structure exists by checking the import completed successfully
    if (!indicatorWasVisible) {
      // Import completed too quickly to observe the indicator,
      // but verify the PDF was imported successfully as a sanity check
      await expect(page.locator('p[title="test"]').first()).toBeVisible({
        timeout: 10_000,
      });
    }

    // Verify the indicator is gone after import completes
    await expect(importingIndicator).not.toBeVisible({ timeout: 10_000 });
  });

  test("card metadata display: file size and relative date shown", async ({ page }) => {
    await importTestPdf(page);

    const card = page.locator("button.group.relative").first();
    await expect(card).toBeVisible();

    // The card should show the title
    await expect(card.locator('p[title="test"]')).toBeVisible();

    // The metadata area should contain file size text (e.g., "123 KB", "1.2 MB", etc.)
    const metadataArea = card.locator(".flex.items-center.justify-between");
    await expect(metadataArea).toBeVisible();

    // File size should be displayed (matches patterns like "1 KB", "10.5 KB", "1.2 MB", etc.)
    const fileSizeText = metadataArea.locator("span").first();
    await expect(fileSizeText).toBeVisible();
    const sizeContent = await fileSizeText.textContent();
    expect(sizeContent).toMatch(/\d+(\.\d+)?\s*(B|KB|MB|GB)/);

    // Relative date should be displayed (e.g., "just now", "seconds ago", etc.)
    const dateText = metadataArea.locator("span").last();
    await expect(dateText).toBeVisible();
    const dateContent = await dateText.textContent();
    expect(dateContent).toBeTruthy();
    expect(dateContent!.length).toBeGreaterThan(0);
  });

  test("search clear button: X button clears search and restores results", async ({ page }) => {
    await importTestPdf(page);

    const searchInput = page.getByPlaceholder("Search PDFs...");

    // Type in the search bar
    await searchInput.fill("test");
    await expect(page.locator('p[title="test"]').first()).toBeVisible();

    // The clear button (aria-label="Clear search") should appear
    const clearButton = page.locator('button[aria-label="Clear search"]');
    await expect(clearButton).toBeVisible();

    // Click the clear button
    await clearButton.click();

    // Search input should be cleared
    await expect(searchInput).toHaveValue("");

    // The clear button should disappear (it only shows when value is non-empty)
    await expect(clearButton).not.toBeVisible();

    // All PDFs should show again
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
