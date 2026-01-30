# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Client-side PDF reader built with Next.js 15 (App Router), React 19, and @embedpdf/react-pdf-viewer (PDFium-based). All PDF storage and rendering happens in the browser using IndexedDB (via Dexie) — no backend required.

## Commands

- `pnpm dev` — Start development server
- `pnpm build` — Production build
- `pnpm lint` — Run Biome linter
- `pnpm format` — Format with Biome
- `pnpm check` — Biome lint + format (auto-fix)
- `pnpm exec playwright test` — Run E2E tests
- `pnpm exec playwright test e2e/some-test.spec.ts` — Run a single E2E test

## Architecture

### Routing (Next.js App Router)

- `/` — Library view (`src/app/page.tsx`)
- `/reader/[id]` — PDF reader view (`src/app/reader/[id]/page.tsx`)

### Data Layer

Dexie wraps IndexedDB with tables defined in `src/lib/db/schema.ts`:

- `pdfFiles` — PDF blobs keyed by id
- `pdfMetadata` — Metadata, thumbnails, indexed by id/fileName/addedAt/lastOpenedAt

CRUD operations live in `src/lib/db/pdf-store.ts`.

### PDF Rendering

`PdfViewerWrapper` (`src/components/reader/PdfViewerWrapper.tsx`) wraps the `<PDFViewer>` drop-in component from `@embedpdf/react-pdf-viewer`:

- Uses PDFium (Chrome's PDF engine) via WebAssembly
- Built-in toolbar with zoom, page navigation, search, and annotations
- Text selection and copying handled internally
- Theme synced via `config.theme.preference`

### Thumbnail Generation

`src/lib/thumbnail-generator.ts` uses `@embedpdf/engines` (PDFium direct engine) to generate JPEG thumbnails and extract page counts. The engine instance is cached as a singleton.

### Custom Hooks (`src/lib/hooks/`)

- `useLibrary` — Library state, search, import/delete
- `usePdfLoader` — Async PDF blob loading and object URL management
- `useTheme` — Theme preference with localStorage
- `useKeyboard` — Global keyboard shortcuts

### Theming

CSS custom properties defined in `src/app/globals.css` with light/dark variants. Theme state managed by `ThemeProvider` context (`src/components/shared/ThemeProvider.tsx`). The resolved theme ("light" | "dark") is passed to the EmbedPDF viewer.

### PDF Import Flow

1. File validated (extension + MIME type + size ≤ 500 MB) → UUID assigned
2. Blob saved to IndexedDB
3. Thumbnail and page count generated asynchronously (fire-and-forget) via EmbedPDF engine

## Agent Usage

Use subagents (Task tool) whenever possible to parallelize work and reduce latency. Launch independent tasks concurrently in a single message.

## Linting & Formatting

Biome (v2) handles both linting and formatting. Config is in `biome.json`.

- Double quotes, semicolons, trailing commas, 100-char line width
- A11y rules enforced: `type="button"` on buttons, `aria-hidden` on decorative SVGs, keyboard handlers on interactive elements
- Suppressed rules: `useExhaustiveDependencies` (off), `noExplicitAny` (off), `noNonNullAssertion` (off)

Run `pnpm check` before committing.

## Key Technical Details

- **Path alias:** `@/*` maps to `src/*`
- **Package manager:** pnpm
- **TypeScript strict mode** is enabled
- **Shared types** live in `src/types/index.ts`
- **PDF engine:** `@embedpdf/react-pdf-viewer` (drop-in viewer) + `@embedpdf/engines` (thumbnail generation)
- **E2E tests** use production build (`pnpm build && pnpm start`) to avoid dev server chunk loading issues
