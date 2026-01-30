import { expect, test } from "@playwright/test";
import { clearIndexedDB, importTestPdf, openFirstPdf, waitForPdfRender } from "./helpers";

test.describe("Responsive Design - Mobile (375x667)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("library renders on mobile without overflow", async ({ page }) => {
    await importTestPdf(page);

    await expect(page.getByRole("heading", { name: "PDF Reader" })).toBeVisible();
    await expect(page.getByPlaceholder("Search PDFs...")).toBeVisible();
    await expect(page.locator('p[title="test"]').first()).toBeVisible();

    const header = page.locator("header");
    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();
    expect(headerBox!.x).toBeGreaterThanOrEqual(0);
    expect(headerBox!.x + headerBox!.width).toBeLessThanOrEqual(375);

    const card = page.locator("button.group").first();
    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.x).toBeGreaterThanOrEqual(0);
    expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(375);
  });

  test("reader renders on mobile", async ({ page }) => {
    await importTestPdf(page);
    await openFirstPdf(page);
    await waitForPdfRender(page);

    const viewerContainer = page.locator('[data-testid="pdf-viewer-container"]');
    await expect(viewerContainer).toBeVisible();
  });

  test("search works on mobile", async ({ page }) => {
    await importTestPdf(page);

    const searchInput = page.getByPlaceholder("Search PDFs...");
    await expect(searchInput).toBeVisible();

    await searchInput.fill("test");
    await expect(page.locator('p[title="test"]').first()).toBeVisible();

    await searchInput.fill("nonexistent");
    await expect(page.getByText("No matching PDFs")).toBeVisible();

    await searchInput.fill("");
    await expect(page.locator('p[title="test"]').first()).toBeVisible();
  });
});

test.describe("Responsive Design - Tablet (768x1024)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("library grid adapts on tablet with multiple columns", async ({ page }) => {
    await importTestPdf(page);
    await importTestPdf(page);
    await importTestPdf(page);

    const cards = page.locator("button.group");
    await expect(cards).toHaveCount(3, { timeout: 15_000 });

    const firstCardBox = await cards.nth(0).boundingBox();
    const secondCardBox = await cards.nth(1).boundingBox();
    expect(firstCardBox).not.toBeNull();
    expect(secondCardBox).not.toBeNull();
    expect(firstCardBox!.y).toEqual(secondCardBox!.y);
    expect(firstCardBox!.x).not.toEqual(secondCardBox!.x);
  });

  test("reader viewer fills tablet viewport", async ({ page }) => {
    await importTestPdf(page);
    await openFirstPdf(page);
    await waitForPdfRender(page);

    const viewerContainer = page.locator('[data-testid="pdf-viewer-container"]');
    await expect(viewerContainer).toBeVisible();
  });
});

test.describe("Responsive Design - Desktop (1280x800)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("library grid uses full width on desktop with multiple columns", async ({ page }) => {
    await importTestPdf(page);
    await importTestPdf(page);
    await importTestPdf(page);
    await importTestPdf(page);

    const cards = page.locator("button.group");
    await expect(cards).toHaveCount(4, { timeout: 15_000 });

    const firstBox = await cards.nth(0).boundingBox();
    const secondBox = await cards.nth(1).boundingBox();
    const thirdBox = await cards.nth(2).boundingBox();
    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();
    expect(thirdBox).not.toBeNull();

    expect(firstBox!.y).toEqual(secondBox!.y);
    expect(secondBox!.y).toEqual(thirdBox!.y);

    const xPositions = [firstBox!.x, secondBox!.x, thirdBox!.x];
    const uniqueX = new Set(xPositions);
    expect(uniqueX.size).toEqual(3);

    for (let i = 0; i < 4; i++) {
      const box = await cards.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(1280);
    }
  });

  test("header elements visible and within viewport on desktop", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "PDF Reader" });
    const searchBar = page.getByPlaceholder("Search PDFs...");
    const openButton = page.getByRole("banner").getByRole("button", { name: "Open PDF" });

    await expect(heading).toBeVisible();
    await expect(searchBar).toBeVisible();
    await expect(openButton).toBeVisible();

    const headingBox = await heading.boundingBox();
    const searchBox = await searchBar.boundingBox();
    const buttonBox = await openButton.boundingBox();
    expect(headingBox).not.toBeNull();
    expect(searchBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();

    for (const box of [headingBox!, searchBox!, buttonBox!]) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(1280);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(800);
    }

    expect(headingBox!.x).toBeLessThan(searchBox!.x);
  });
});
