# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-02-04

### Added

- PWA manifest screenshots for mobile and desktop form factors
- PDF dark mode toggle in reader view that inverts document colors for comfortable reading in low light
- PDF dark mode preference persistence in localStorage
- Custom hook `usePdfDarkMode` for managing PDF-specific theme state
- E2E test coverage for PDF dark mode functionality

### Fixed

- PWA manifest validation errors for install UI

## [1.0.0] - 2025-06-15

### Added

- PDF import via file picker and drag-and-drop with validation (type, extension, 500 MB limit)
- Full-featured PDF reader with zoom, search, text selection, and annotations (PDFium via WebAssembly)
- Reading state persistence (page position, zoom level) across sessions
- Automatic thumbnail generation and page count extraction
- PDF library with grid view, search, and sorting (last opened, date added, title, file size)
- Star/favorite PDFs to pin them at the top of the library
- Bulk selection and deletion
- Undo delete with timed toast notification
- File details modal with metadata and thumbnail preview
- Storage usage indicator with available quota display
- Light/dark theme with system preference detection
- Keyboard shortcuts (press `?` to view all)
- Keyboard navigation (Escape to return to library)
- Fully offline operation — all data stored in IndexedDB, never uploaded
- Docker support for self-hosting
- CI pipeline with automated Docker image publishing
