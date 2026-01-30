import { expect, test } from "@playwright/test";
import { clearIndexedDB, importTestPdf } from "./helpers";

test.describe("Accessibility & Dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("delete dialog is dismissed by pressing Escape", async ({ page }) => {
    await importTestPdf(page);

    const card = page.locator("button.group.relative").first();
    await card.hover();
    await card.locator('button[aria-label*="Delete"]').click();
    await expect(page.getByText("Delete PDF?")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByText("Delete PDF?")).not.toBeVisible();
    await expect(page.locator('p[title="test"]').first()).toBeVisible();
  });

  test("delete dialog is dismissed by clicking the backdrop", async ({ page }) => {
    await importTestPdf(page);

    const card = page.locator("button.group.relative").first();
    await card.hover();
    await card.locator('button[aria-label*="Delete"]').click();
    await expect(page.getByText("Delete PDF?")).toBeVisible();
    // The dialog uses native <dialog> with showModal(). Its onClick handler checks
    // if click coordinates fall outside the dialog's bounding rect to dismiss.
    const dialog = page.locator("dialog[open]");
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    // Click below the dialog in the backdrop area
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height + 50);
    await expect(page.getByText("Delete PDF?")).not.toBeVisible({ timeout: 5_000 });
    await expect(page.locator('p[title="test"]').first()).toBeVisible();
  });

  test("PDF card keyboard activation with Enter", async ({ page }) => {
    await importTestPdf(page);

    const card = page.locator("button.group.relative").first();
    await card.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/reader\/.+/, { timeout: 10_000 });
  });

  test("PDF card keyboard activation with Space", async ({ page }) => {
    await importTestPdf(page);

    const card = page.locator("button.group.relative").first();
    await card.focus();
    await page.keyboard.press("Space");
    await expect(page).toHaveURL(/\/reader\/.+/, { timeout: 10_000 });
  });

  test("all buttons have a type attribute", async ({ page }) => {
    await importTestPdf(page);
    await expect(page.locator('p[title="test"]').first()).toBeVisible();

    const buttons = page.locator("button");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const typeAttr = await button.getAttribute("type");
      expect(typeAttr, `Button at index ${i} is missing a type attribute`).toBeTruthy();
      expect(
        typeAttr === "button" || typeAttr === "submit",
        `Button at index ${i} has type="${typeAttr}", expected "button" or "submit"`,
      ).toBe(true);
    }
  });

  test("decorative SVGs inside icon buttons have aria-hidden", async ({ page }) => {
    await page.goto("/");

    const svgs = page.locator("svg");
    const count = await svgs.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const svg = svgs.nth(i);
      const parentButton = svg.locator("xpath=ancestor::button[@aria-label]");
      const isInsideAriaLabeledButton = (await parentButton.count()) > 0;

      if (isInsideAriaLabeledButton) {
        const ariaHidden = await svg.getAttribute("aria-hidden");
        expect(
          ariaHidden,
          `SVG at index ${i} inside an aria-labeled button should have aria-hidden="true"`,
        ).toBe("true");
      }
    }
  });

  test("interactive elements are keyboard focusable", async ({ page }) => {
    await importTestPdf(page);
    await expect(page.locator('p[title="test"]').first()).toBeVisible();

    const searchInput = page.getByPlaceholder("Search PDFs...");
    await searchInput.focus();
    await expect(searchInput).toBeFocused();

    const openButton = page.getByRole("banner").getByRole("button", { name: "Open PDF" });
    await openButton.focus();
    await expect(openButton).toBeFocused();

    const themeToggle = page.locator('button[aria-label*="Current theme"]').first();
    await themeToggle.focus();
    await expect(themeToggle).toBeFocused();

    const card = page.locator("button.group.relative").first();
    await card.focus();
    await expect(card).toBeFocused();
  });

  test("ARIA labels are present on all icon buttons", async ({ page }) => {
    await importTestPdf(page);
    await expect(page.locator('p[title="test"]').first()).toBeVisible();

    // Delete button
    const card = page.locator("button.group.relative").first();
    await card.hover();
    const deleteButton = card.locator('button[aria-label*="Delete"]');
    await expect(deleteButton).toHaveAttribute("aria-label", /Delete/);

    // Theme toggle
    const libraryThemeToggle = page.locator('button[aria-label*="Current theme"]').first();
    await expect(libraryThemeToggle).toHaveAttribute("aria-label", /Current theme/);

    // Clear search button
    const searchInput = page.getByPlaceholder("Search PDFs...");
    await searchInput.fill("test");
    const clearSearch = page.locator('button[aria-label="Clear search"]');
    await expect(clearSearch).toBeVisible();
    await expect(clearSearch).toHaveAttribute("aria-label", "Clear search");
  });
});
