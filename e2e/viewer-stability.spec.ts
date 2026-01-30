import { expect, test } from "@playwright/test";
import { clearIndexedDB, importTestPdf, openFirstPdf, waitForPdfRender } from "./helpers";

test.describe("Viewer Stability", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await importTestPdf(page);
    await openFirstPdf(page);
    await waitForPdfRender(page);
  });

  test("viewer renders without page errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    // Wait a moment to catch any deferred errors
    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(
      (e) => e.includes("removeChild") || e.includes("not a child") || e.includes("Cannot read"),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("navigating back and forth does not throw errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    // Navigate back to library
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL("/");
    await page.waitForTimeout(500);

    // Go back to reader
    await openFirstPdf(page);
    await waitForPdfRender(page);
    await page.waitForTimeout(1000);

    const criticalErrors = errors.filter(
      (e) => e.includes("removeChild") || e.includes("not a child") || e.includes("Cannot read"),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("viewer container is structurally present", async ({ page }) => {
    const container = page.locator('[data-testid="pdf-viewer-container"]');
    await expect(container).toBeVisible();

    // Container should have child elements (EmbedPDF rendered content)
    const childCount = await container.locator("> *").count();
    expect(childCount).toBeGreaterThanOrEqual(1);
  });
});
