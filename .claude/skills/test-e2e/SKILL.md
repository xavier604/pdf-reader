---
name: test-e2e
description: Run E2E tests following project conventions for speed
---

When running E2E tests, optimize for speed:

1. **Pre-build and reuse the server.** Before running tests, start the server in a background shell (`pnpm build && pnpm start`). Playwright's `reuseExistingServer` is enabled locally, so subsequent test runs skip the rebuild entirely.
2. **Use `--project=chromium`** when iterating on code or debugging failures. Only run the full suite (chromium + firefox) for final verification.
3. **Target specific spec files** when changes only affect a known area (e.g., `pnpm exec playwright test e2e/library.spec.ts --project=chromium`).
4. **Webkit failures are expected** — All webkit tests that go through the `importTestPdf` helper fail due to a pre-existing PDFium WebAssembly incompatibility with Playwright's webkit engine. Chromium and Firefox pass fully. Ignore these webkit failures.
