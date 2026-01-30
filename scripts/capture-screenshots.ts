import { chromium } from "@playwright/test";
import path from "path";

const SAMPLE_PDF = path.join(__dirname, "..", "context", "sample.pdf");
const SCREENSHOTS_DIR = path.join(__dirname, "..", "screenshots");

async function capture() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  // --- Library screenshots ---
  await page.goto("http://localhost:3000");
  // Clear any existing data
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name) indexedDB.deleteDatabase(db.name);
    }
  });
  await page.reload();
  await page.waitForLoadState("networkidle");

  // Import the sample PDF
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(SAMPLE_PDF);
  const expectedTitle = path.basename(SAMPLE_PDF, ".pdf");
  await page.locator(`p[title="${expectedTitle}"]`).first().waitFor({ state: "visible", timeout: 15_000 });
  // Wait for thumbnail to generate
  await page.waitForTimeout(3000);

  // Light mode screenshot
  await page.evaluate(() => {
    localStorage.setItem("pdf-reader-theme", "light");
  });
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.locator(`p[title="${expectedTitle}"]`).first().waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "library-light.png") });
  console.log("Captured library-light.png");

  // Dark mode screenshot
  await page.evaluate(() => {
    localStorage.setItem("pdf-reader-theme", "dark");
  });
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.locator(`p[title="${expectedTitle}"]`).first().waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "library-dark.png") });
  console.log("Captured library-dark.png");

  // --- Reader screenshots ---
  // Open the PDF (click the card)
  await page.locator(`p[title="${expectedTitle}"]`).first().click();
  await page.waitForURL(/\/reader\/.+/, { timeout: 10_000 });

  // Wait for PDF to render
  const container = page.locator('[data-testid="pdf-viewer-container"]');
  await container.waitFor({ state: "visible", timeout: 30_000 });
  await container.locator("canvas").first().waitFor({ state: "attached", timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Light mode reader
  await page.evaluate(() => {
    localStorage.setItem("pdf-reader-theme", "light");
  });
  await page.reload();
  await page.waitForLoadState("networkidle");
  await container.waitFor({ state: "visible", timeout: 30_000 });
  await container.locator("canvas").first().waitFor({ state: "attached", timeout: 30_000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "reader-light.png") });
  console.log("Captured reader-light.png");

  // Dark mode reader
  await page.evaluate(() => {
    localStorage.setItem("pdf-reader-theme", "dark");
  });
  await page.reload();
  await page.waitForLoadState("networkidle");
  await container.waitFor({ state: "visible", timeout: 30_000 });
  await container.locator("canvas").first().waitFor({ state: "attached", timeout: 30_000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "reader-dark.png") });
  console.log("Captured reader-dark.png");

  await browser.close();
  console.log("All screenshots captured!");
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
