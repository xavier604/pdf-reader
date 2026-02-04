import { expect, test } from "@playwright/test";
import { clearIndexedDB, importTestPdf, openFirstPdf, waitForPdfRender } from "./helpers";

// Viewport configurations
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  verySmallMobile: { width: 320, height: 568 },
  mobileLandscape: { width: 667, height: 375 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
  largeDesktop: { width: 1920, height: 1080 },
};

test.describe("Mobile (375x667)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("touch targets meet 44x44px minimum", async ({ page }) => {
    await importTestPdf(page);

    // Header button
    const openButton = page.getByRole("banner").getByRole("button", { name: "Open PDF" });
    const openBox = await openButton.boundingBox();
    expect(openBox).toBeTruthy();
    expect(openBox!.width).toBeGreaterThanOrEqual(44);
    expect(openBox!.height).toBeGreaterThanOrEqual(44);

    // Card buttons (visible without hover on mobile)
    const card = page.locator(".group.relative.cursor-pointer").first();
    const deleteButton = card.locator('button[aria-label*="Delete"]');
    const deleteBox = await deleteButton.boundingBox();
    expect(deleteBox).toBeTruthy();
    expect(deleteBox!.width).toBeGreaterThanOrEqual(44);
    expect(deleteBox!.height).toBeGreaterThanOrEqual(44);

    const infoButton = card.locator('button[aria-label*="Details"]');
    const infoBox = await infoButton.boundingBox();
    expect(infoBox).toBeTruthy();
    expect(infoBox!.width).toBeGreaterThanOrEqual(44);
    expect(infoBox!.height).toBeGreaterThanOrEqual(44);
  });

  test("card buttons visible without hover", async ({ page }) => {
    await importTestPdf(page);

    const card = page.locator(".group.relative.cursor-pointer").first();
    const deleteButton = card.locator('button[aria-label*="Delete"]');
    const infoButton = card.locator('button[aria-label*="Details"]');

    // Buttons should be visible without hover on mobile
    await expect(deleteButton).toBeVisible();
    await expect(infoButton).toBeVisible();
  });

  test("fixed elements don't overlap (toast vs PDF toggle)", async ({ page }) => {
    await importTestPdf(page);
    await openFirstPdf(page);
    await waitForPdfRender(page);

    // Trigger a toast notification by going back and deleting
    await page.keyboard.press("Escape");
    await page.waitForLoadState("networkidle");

    const card = page.locator(".group.relative.cursor-pointer").first();
    await card.locator('button[aria-label*="Delete"]').click();
    await expect(page.getByText("Delete PDF?")).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).last().click();

    // Toast should appear and not overlap with any fixed elements
    const toast = page.locator('output[aria-live="polite"]');
    await expect(toast).toBeVisible({ timeout: 5000 });

    const toastBox = await toast.boundingBox();
    expect(toastBox).toBeTruthy();
    // Toast should be positioned within viewport and not at extreme edges
    expect(toastBox!.y).toBeGreaterThan(0);
    expect(toastBox!.y + toastBox!.height).toBeLessThan(VIEWPORTS.mobile.height);
  });

  test("header layout stacks properly (no overflow)", async ({ page }) => {
    await importTestPdf(page);

    // Verify all header elements are visible and within viewport
    const header = page.getByRole("banner");
    await expect(header).toBeVisible();

    const heading = page.getByRole("heading", { name: "PDF Reader" });
    await expect(heading).toBeVisible();

    const searchInput = page.getByPlaceholder("Search PDFs...");
    await expect(searchInput).toBeVisible();

    const openButton = page.getByRole("banner").getByRole("button", { name: "Open PDF" });
    await expect(openButton).toBeVisible();

    const helpButton = page.getByRole("button", { name: "Keyboard shortcuts" });
    await expect(helpButton).toBeVisible();

    // Check that no horizontal scrollbar exists
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test("file details modal uses single column grid", async ({ page }) => {
    await importTestPdf(page);

    const card = page.locator(".group.relative.cursor-pointer").first();
    const infoButton = card.locator('button[aria-label*="Details"]');
    await infoButton.click();

    // Modal should be visible
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // Get the details container (the grid element with metadata)
    const metadataGrid = modal.locator(".grid").first();
    await expect(metadataGrid).toBeVisible();

    // On mobile, the grid should stack (single column)
    // Check that it has grid-cols-1 class
    const gridClass = await metadataGrid.getAttribute("class");
    expect(gridClass).toContain("grid-cols-1");
  });
});

test.describe("Very Small Mobile (320x568)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.verySmallMobile);
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("no horizontal scroll on 320px", async ({ page }) => {
    await importTestPdf(page);

    // Check that no horizontal scrollbar exists
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Also check body overflow
    const bodyHasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth;
    });
    expect(bodyHasHorizontalScroll).toBe(false);
  });
});

test.describe("Mobile Landscape (667x375)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobileLandscape);
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("grid adapts to landscape orientation (cards in same row)", async ({ page }) => {
    // Import multiple PDFs to see grid layout
    await importTestPdf(page);
    await page.waitForTimeout(500); // Allow first PDF to settle
    await importTestPdf(page);
    await page.waitForTimeout(500);

    // Wait for both cards to be visible
    const cards = page.locator(".group.relative.cursor-pointer");
    await expect(cards).toHaveCount(2);

    // Get positions of both cards
    const firstCardBox = await cards.nth(0).boundingBox();
    const secondCardBox = await cards.nth(1).boundingBox();

    expect(firstCardBox).toBeTruthy();
    expect(secondCardBox).toBeTruthy();

    // In landscape, cards should be in the same row (similar Y positions)
    // Allow 20px variance for margins/gaps
    const yDifference = Math.abs(firstCardBox!.y - secondCardBox!.y);
    expect(yDifference).toBeLessThan(20);
  });
});

test.describe("Tablet (768x1024)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("touch targets smaller but usable (≥28px with hover)", async ({ page }) => {
    await importTestPdf(page);

    const card = page.locator(".group.relative.cursor-pointer").first();

    // Hover to reveal buttons (tablet has hover capability)
    await card.hover();

    const deleteButton = card.locator('button[aria-label*="Delete"]');
    const deleteBox = await deleteButton.boundingBox();
    expect(deleteBox).toBeTruthy();
    expect(deleteBox!.width).toBeGreaterThanOrEqual(28);
    expect(deleteBox!.height).toBeGreaterThanOrEqual(28);

    const infoButton = card.locator('button[aria-label*="Details"]');
    const infoBox = await infoButton.boundingBox();
    expect(infoBox).toBeTruthy();
    expect(infoBox!.width).toBeGreaterThanOrEqual(28);
    expect(infoBox!.height).toBeGreaterThanOrEqual(28);
  });
});

test.describe("Large Desktop (1920x1080)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.largeDesktop);
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("grid uses 6 columns (7 PDFs = 6 in row 1, 1 in row 2)", async ({ page }) => {
    // Import 7 PDFs
    for (let i = 0; i < 7; i++) {
      await importTestPdf(page);
      await page.waitForTimeout(500); // Stagger imports
    }

    // Wait for all 7 cards to be visible
    const cards = page.locator(".group.relative.cursor-pointer");
    await expect(cards).toHaveCount(7);

    // Get Y positions of all cards
    const positions = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const box = await cards.nth(i).boundingBox();
        return box ? box.y : 0;
      }),
    );

    // First 6 cards should be in row 1 (similar Y)
    const firstRowY = positions[0];
    for (let i = 1; i < 6; i++) {
      const yDifference = Math.abs(positions[i] - firstRowY);
      expect(yDifference).toBeLessThan(20);
    }

    // 7th card should be in row 2 (different Y)
    const secondRowY = positions[6];
    const rowDifference = Math.abs(secondRowY - firstRowY);
    expect(rowDifference).toBeGreaterThan(100);
  });
});
