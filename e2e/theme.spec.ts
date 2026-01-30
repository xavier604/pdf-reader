import { expect, test } from "@playwright/test";
import { clearIndexedDB } from "./helpers";

test.describe("Theme System", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("defaults to no dark class (system/light)", async ({ page }) => {
    const hasDarkClass = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    expect(hasDarkClass).toBe(false);
  });

  test("theme toggle cycles through modes without error", async ({ page }) => {
    const themeBtn = page.locator('button[title*="theme"], button[aria-label*="theme"]').first();
    await expect(themeBtn).toBeVisible();

    for (let i = 0; i < 3; i++) {
      await themeBtn.click();
      await page.waitForTimeout(300);
    }

    await expect(themeBtn).toBeVisible();
  });

  test("dark theme persists via localStorage", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem("pdf-reader-theme", "dark");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const hasDarkClass = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    expect(hasDarkClass).toBe(true);
  });

  test("light theme persists via localStorage", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem("pdf-reader-theme", "light");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const hasDarkClass = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    expect(hasDarkClass).toBe(false);
  });
});
