import { chromium } from "@playwright/test";
import path from "path";

const SAMPLE_PDF = path.join(__dirname, "..", "context", "sample.pdf");
const PUBLIC_DIR = path.join(__dirname, "..", "public");

async function capture() {
  const browser = await chromium.launch();

  // --- Desktop screenshot (wide form factor) ---
  console.log("Capturing desktop screenshot...");
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const desktopPage = await desktopContext.newPage();

  await desktopPage.goto("http://localhost:3001");
  // Clear any existing data
  await desktopPage.evaluate(async () => {
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name) indexedDB.deleteDatabase(db.name);
    }
  });
  await desktopPage.reload();
  await desktopPage.waitForLoadState("networkidle");

  // Import the sample PDF
  const fileInput = desktopPage.locator('input[type="file"]');
  await fileInput.setInputFiles(SAMPLE_PDF);
  const expectedTitle = path.basename(SAMPLE_PDF, ".pdf");
  await desktopPage
    .locator(`p[title="${expectedTitle}"]`)
    .first()
    .waitFor({ state: "visible", timeout: 15_000 });
  // Wait for thumbnail to generate
  await desktopPage.waitForTimeout(3000);

  // Set light mode for consistency
  await desktopPage.evaluate(() => {
    localStorage.setItem("pdf-reader-theme", "light");
  });
  await desktopPage.reload();
  await desktopPage.waitForLoadState("networkidle");
  await desktopPage
    .locator(`p[title="${expectedTitle}"]`)
    .first()
    .waitFor({ state: "visible", timeout: 15_000 });
  await desktopPage.waitForTimeout(2000);

  await desktopPage.screenshot({
    path: path.join(PUBLIC_DIR, "screenshot-desktop-1.png"),
  });
  console.log("✓ Captured screenshot-desktop-1.png (1280x720)");

  await desktopContext.close();

  // --- Mobile screenshot (narrow form factor) ---
  console.log("Capturing mobile screenshot...");
  const mobileContext = await browser.newContext({
    viewport: { width: 750, height: 1334 },
  });
  const mobilePage = await mobileContext.newPage();

  await mobilePage.goto("http://localhost:3001");
  // Clear any existing data
  await mobilePage.evaluate(async () => {
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name) indexedDB.deleteDatabase(db.name);
    }
  });
  await mobilePage.reload();
  await mobilePage.waitForLoadState("networkidle");

  // Import the sample PDF
  const mobileFileInput = mobilePage.locator('input[type="file"]');
  await mobileFileInput.setInputFiles(SAMPLE_PDF);
  await mobilePage
    .locator(`p[title="${expectedTitle}"]`)
    .first()
    .waitFor({ state: "visible", timeout: 15_000 });
  // Wait for thumbnail to generate
  await mobilePage.waitForTimeout(3000);

  // Set light mode for consistency
  await mobilePage.evaluate(() => {
    localStorage.setItem("pdf-reader-theme", "light");
  });
  await mobilePage.reload();
  await mobilePage.waitForLoadState("networkidle");
  await mobilePage
    .locator(`p[title="${expectedTitle}"]`)
    .first()
    .waitFor({ state: "visible", timeout: 15_000 });
  await mobilePage.waitForTimeout(2000);

  await mobilePage.screenshot({
    path: path.join(PUBLIC_DIR, "screenshot-mobile-1.png"),
  });
  console.log("✓ Captured screenshot-mobile-1.png (750x1334)");

  await mobileContext.close();
  await browser.close();

  console.log("\n✓ All PWA screenshots captured successfully!");
  console.log("  - /public/screenshot-desktop-1.png");
  console.log("  - /public/screenshot-mobile-1.png");
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
