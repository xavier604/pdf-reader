import { type BrowserContext, expect, type Page, test } from "@playwright/test";
import { importTestPdf } from "./helpers";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function waitForSWActivation(page: Page, timeout = 15_000): Promise<void> {
  await page.evaluate(async (ms) => {
    const start = Date.now();
    while (Date.now() - start < ms) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.active?.state === "activated") return;
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error("Service worker did not activate in time");
  }, timeout);
}

async function simulateOffline(context: BrowserContext): Promise<void> {
  await context.route("**/*", (route) => {
    if (route.request().serviceWorker()) {
      route.abort();
    } else {
      route.continue();
    }
  });
}

async function removeOffline(context: BrowserContext): Promise<void> {
  await context.unrouteAll({ behavior: "wait" });
}

// ---------------------------------------------------------------------------
// Group 1 — Web App Manifest (all browsers)
// ---------------------------------------------------------------------------

test.describe("Web App Manifest", () => {
  test("HTML contains manifest link tag", async ({ page }) => {
    await page.goto("/");
    const link = page.locator('link[rel="manifest"]');
    await expect(link).toHaveAttribute("href", "/manifest.json");
  });

  test("manifest has required installability fields", async ({ page }) => {
    const res = await page.request.get("/manifest.json");
    expect(res.ok()).toBe(true);

    const manifest = await res.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBeTruthy();

    const sizes = (manifest.icons as { sizes: string }[]).map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });

  test("icon URLs are fetchable", async ({ page }) => {
    const res = await page.request.get("/manifest.json");
    const manifest = await res.json();

    const uniqueSrcs = [...new Set((manifest.icons as { src: string }[]).map((i) => i.src))];
    expect(uniqueSrcs.length).toBeGreaterThan(0);

    for (const src of uniqueSrcs) {
      const iconRes = await page.request.get(src);
      expect(iconRes.ok(), `icon ${src} should be fetchable`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Group 2 — Service Worker (Chromium only)
// ---------------------------------------------------------------------------

test.describe("Service Worker", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Service Worker tests: Chromium only");

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
  });

  test("registers and activates", async ({ page, context }) => {
    await waitForSWActivation(page);

    const workers = context.serviceWorkers();
    const swUrls = workers.map((w) => w.url());
    expect(swUrls.some((u) => u.includes("sw.js"))).toBe(true);
  });

  test("creates precache entries", async ({ page }) => {
    await waitForSWActivation(page);

    const cacheNames: string[] = await page.evaluate(() => caches.keys());
    expect(cacheNames.some((n) => n.includes("serwist-precache"))).toBe(true);
  });

  test("serves from cache on reload", async ({ page }) => {
    await waitForSWActivation(page);

    // Second load — at least one response should come from the SW
    let fromSW = false;
    page.on("response", (res) => {
      if (res.fromServiceWorker()) fromSW = true;
    });
    await page.reload({ waitUntil: "load" });

    expect(fromSW).toBe(true);
  });

  test("WASM bypasses SW and loads successfully", async ({ page }) => {
    await waitForSWActivation(page);
    await importTestPdf(page);

    // WASM bypasses service worker to avoid Firefox CORS issues with opaque responses
    // Verify WASM was fetched successfully by checking that PDF was processed (pageCount > 0)
    // Thumbnail generation is async, so poll until pageCount is populated
    const metadata = await page.evaluate(async () => {
      const start = Date.now();
      const timeout = 10_000;
      while (Date.now() - start < timeout) {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const req = indexedDB.open("PdfReaderDB");
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        const tx = db.transaction("pdfMetadata", "readonly");
        const all = await new Promise<any[]>((resolve) => {
          const req = tx.objectStore("pdfMetadata").getAll();
          req.onsuccess = () => resolve(req.result);
        });
        const pageCount = all[0]?.pageCount || 0;
        if (pageCount > 0) {
          return pageCount;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      throw new Error("Thumbnail generation did not complete in time");
    });

    expect(metadata).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Group 3 — Offline Support (Chromium only)
// ---------------------------------------------------------------------------

test.describe("Offline Support", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Offline tests: Chromium only");

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForSWActivation(page);
    // Reload so the SW serves the cached page
    await page.reload({ waitUntil: "load" });
  });

  test("cached home page works offline", async ({ page, context }) => {
    await simulateOffline(context);
    await page.reload({ waitUntil: "load" });

    await expect(page.getByRole("heading", { name: "PDF Reader" })).toBeVisible();
    await removeOffline(context);
  });

  test("uncached route shows offline fallback", async ({ page, context }) => {
    await simulateOffline(context);
    await page.goto("/reader/nonexistent", { waitUntil: "load" });

    await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
    await removeOffline(context);
  });
});
