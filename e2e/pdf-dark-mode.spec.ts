import { expect, test } from "@playwright/test";
import { clearIndexedDB, importTestPdf, openFirstPdf, waitForPdfRender } from "./helpers";

test.describe("PDF Dark Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await importTestPdf(page);
    await openFirstPdf(page);
    await waitForPdfRender(page);
  });

  test("toggle button is visible in reader", async ({ page }) => {
    const toggleButton = page.getByRole("button", { name: /PDF dark mode/i });
    await expect(toggleButton).toBeVisible();
  });

  test("enables PDF dark mode when toggle is clicked", async ({ page }) => {
    const toggleButton = page.getByRole("button", { name: /Enable PDF dark mode/i });
    const container = page.locator('[data-testid="pdf-viewer-container"]');

    // Verify dark mode is initially disabled
    await expect(container).toHaveAttribute("data-pdf-dark-mode", "false");

    // Enable dark mode
    await toggleButton.click();
    await page.waitForTimeout(500); // Wait for JavaScript to apply filter

    // Verify data-pdf-dark-mode attribute is set
    await expect(container).toHaveAttribute("data-pdf-dark-mode", "true");

    // Verify button text changes
    await expect(page.getByRole("button", { name: /Disable PDF dark mode/i })).toBeVisible();
  });

  test("disables PDF dark mode when toggle is clicked again", async ({ page }) => {
    const container = page.locator('[data-testid="pdf-viewer-container"]');

    // Enable dark mode first
    await page.getByRole("button", { name: /Enable PDF dark mode/i }).click();
    await page.waitForTimeout(500);
    await expect(container).toHaveAttribute("data-pdf-dark-mode", "true");

    // Disable dark mode
    await page.getByRole("button", { name: /Disable PDF dark mode/i }).click();
    await page.waitForTimeout(500);

    // Verify data-pdf-dark-mode attribute is set to false
    await expect(container).toHaveAttribute("data-pdf-dark-mode", "false");

    // Verify button text changes back
    await expect(page.getByRole("button", { name: /Enable PDF dark mode/i })).toBeVisible();
  });

  test("persists PDF dark mode preference across page reloads", async ({ page }) => {
    const container = page.locator('[data-testid="pdf-viewer-container"]');

    // Enable dark mode
    await page.getByRole("button", { name: /Enable PDF dark mode/i }).click();
    await page.waitForTimeout(500);
    await expect(container).toHaveAttribute("data-pdf-dark-mode", "true");

    // Reload the page
    await page.reload();
    await waitForPdfRender(page);

    // Verify dark mode is still enabled after reload
    await expect(container).toHaveAttribute("data-pdf-dark-mode", "true");
    await expect(page.getByRole("button", { name: /Disable PDF dark mode/i })).toBeVisible();
  });

  test("persists disabled state across page reloads", async ({ page }) => {
    const container = page.locator('[data-testid="pdf-viewer-container"]');

    // Verify dark mode is initially disabled
    await expect(container).toHaveAttribute("data-pdf-dark-mode", "false");

    // Reload the page
    await page.reload();
    await waitForPdfRender(page);

    // Verify dark mode is still disabled after reload
    await expect(container).toHaveAttribute("data-pdf-dark-mode", "false");
    await expect(page.getByRole("button", { name: /Enable PDF dark mode/i })).toBeVisible();
  });

  test("applies CSS filter to PDF content", async ({ page }) => {
    // Enable dark mode
    await page.getByRole("button", { name: /Enable PDF dark mode/i }).click();
    await page.waitForTimeout(2500); // Wait for JavaScript to apply filter

    // Verify the inline-block container has the filter applied
    const contentFilter = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="pdf-viewer-container"]');
      const embedpdf = container?.querySelector("embedpdf-container");
      if (!embedpdf) return "none";

      const shadowRoot = (embedpdf as any).shadowRoot;
      if (!shadowRoot) return "none";

      const documentContent = shadowRoot.querySelector("#document-content");
      if (!documentContent) return "none";

      // Find the inline-block container
      const pdfContainer = documentContent.querySelector('div[style*="display: inline-block"]');
      if (!pdfContainer) return "none";

      return window.getComputedStyle(pdfContainer).filter;
    });

    // The filter should contain "invert" and "hue-rotate"
    expect(contentFilter).toContain("invert");
    expect(contentFilter).toContain("hue-rotate");
  });

  test("dark mode works independently of app theme", async ({ page }) => {
    const container = page.locator('[data-testid="pdf-viewer-container"]');

    // Enable PDF dark mode
    await page.getByRole("button", { name: /Enable PDF dark mode/i }).click();
    await page.waitForTimeout(500);
    await expect(container).toHaveAttribute("data-pdf-dark-mode", "true");

    // Navigate back to library
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL("/");

    // Open PDF again
    await openFirstPdf(page);
    await waitForPdfRender(page);

    // Verify PDF dark mode is still enabled (independent of app theme)
    await expect(container).toHaveAttribute("data-pdf-dark-mode", "true");
  });

  test("background and toolbar remain normal when PDF dark mode is enabled", async ({ page }) => {
    const container = page.locator('[data-testid="pdf-viewer-container"]');

    // Get the background color before enabling dark mode
    const bgColorBefore = await container.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Enable PDF dark mode
    await page.getByRole("button", { name: /Enable PDF dark mode/i }).click();
    await page.waitForTimeout(1000);
    await expect(container).toHaveAttribute("data-pdf-dark-mode", "true");

    // Verify background color hasn't changed (not inverted)
    const bgColorAfter = await container.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    expect(bgColorAfter).toBe(bgColorBefore);

    // Verify the container doesn't have a filter directly
    // (filter should only be on canvas elements)
    const containerFilter = await container.evaluate((el) => {
      return window.getComputedStyle(el).filter;
    });
    expect(containerFilter).toBe("none");

    // Verify the embedpdf-container itself doesn't have a filter
    const embedpdfFilter = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="pdf-viewer-container"]');
      const embedpdf = container?.querySelector("embedpdf-container");
      if (!embedpdf) return "unknown";
      return window.getComputedStyle(embedpdf).filter;
    });
    expect(embedpdfFilter).toBe("none");
  });
});
