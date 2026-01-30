import { expect, test } from "@playwright/test";
import { clearIndexedDB, importTestPdf, openFirstPdf, waitForPdfRender } from "./helpers";

test.describe("Reader View", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await importTestPdf(page);
    await openFirstPdf(page);
  });

  test("renders PDF viewer", async ({ page }) => {
    await waitForPdfRender(page);

    const container = page.locator('[data-testid="pdf-viewer-container"]');
    await expect(container).toBeVisible();

    // The viewer should have rendered content inside the container
    const childCount = await container.locator("> *").count();
    expect(childCount).toBeGreaterThanOrEqual(1);
  });

  test("Escape key navigates back to library", async ({ page }) => {
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL("/");
  });

  test("displays error for non-existent PDF ID", async ({ page }) => {
    await page.goto("/reader/non-existent-id");
    await expect(page.getByText("PDF not found")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Back to Library" })).toBeVisible();
  });

  test("error page back button returns to library", async ({ page }) => {
    await page.goto("/reader/non-existent-id");
    await expect(page.getByRole("button", { name: "Back to Library" })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: "Back to Library" }).click();
    await expect(page).toHaveURL("/");
  });
});
