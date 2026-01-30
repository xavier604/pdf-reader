import { expect, test } from "@playwright/test";
import { clearIndexedDB, importTestPdf, openFirstPdf } from "./helpers";

test.describe("Library View", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("shows empty state when no PDFs are loaded", async ({ page }) => {
    await expect(page.getByText("No PDFs yet")).toBeVisible();
    await expect(page.getByRole("main").getByRole("button", { name: "Open PDF" })).toBeVisible();
  });

  test("displays header with title, search bar, and open button", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "PDF Reader" })).toBeVisible();
    await expect(page.getByPlaceholder("Search PDFs...")).toBeVisible();
    await expect(page.getByRole("banner").getByRole("button", { name: "Open PDF" })).toBeVisible();
  });

  test("imports a PDF via file input and shows card in grid", async ({ page }) => {
    await importTestPdf(page);
    await expect(page.locator('p[title="test"]').first()).toBeVisible();
    await expect(page.getByText("No PDFs yet")).not.toBeVisible();
  });

  test("search filters PDFs by title", async ({ page }) => {
    await importTestPdf(page);

    const searchInput = page.getByPlaceholder("Search PDFs...");
    await searchInput.fill("test");
    await expect(page.locator('p[title="test"]').first()).toBeVisible();

    await searchInput.fill("nonexistent");
    await expect(page.getByText("No matching PDFs")).toBeVisible();

    await searchInput.fill("");
    await expect(page.locator('p[title="test"]').first()).toBeVisible();
  });

  test("delete flow: shows confirmation dialog and removes PDF", async ({ page }) => {
    await importTestPdf(page);

    const card = page.locator(".group.relative.cursor-pointer").first();
    await card.hover();
    await card.locator('button[aria-label*="Delete"]').click();
    await expect(page.getByText("Delete PDF?")).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).last().click();
    await expect(page.getByText("No PDFs yet")).toBeVisible({ timeout: 5000 });
  });

  test("delete dialog: cancel keeps the PDF", async ({ page }) => {
    await importTestPdf(page);

    const card = page.locator(".group.relative.cursor-pointer").first();
    await card.hover();
    await card.locator('button[aria-label*="Delete"]').click();
    await expect(page.getByText("Delete PDF?")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.locator('p[title="test"]').first()).toBeVisible();
  });

  test("clicking a PDF card navigates to reader", async ({ page }) => {
    await importTestPdf(page);
    await openFirstPdf(page);
    await expect(page).toHaveURL(/\/reader\/.+/);
  });

  test("persists PDFs across page reload", async ({ page }) => {
    await importTestPdf(page);
    await expect(page.locator('p[title="test"]').first()).toBeVisible();

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.locator('p[title="test"]').first()).toBeVisible({ timeout: 5000 });
  });
});
