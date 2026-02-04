/**
 * Centralized application constants
 */

// ===========================
// THUMBNAIL CONFIGURATION
// ===========================

/** Width of generated PDF thumbnails in pixels */
export const THUMBNAIL_WIDTH = 300;

/** JPEG quality for thumbnail generation (0.0 to 1.0) */
export const JPEG_QUALITY = 0.85;

// ===========================
// PDF IMPORT LIMITS
// ===========================

/** Maximum allowed PDF file size in bytes (500 MB) */
export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

/** Maximum allowed PDF file size in MB (for display in error messages) */
export const MAX_FILE_SIZE_MB = 500;

/** Allowed file extensions for PDF imports */
export const ALLOWED_EXTENSIONS = [".pdf"] as const;

/** Allowed MIME types for PDF imports */
export const ALLOWED_MIME_TYPES = ["application/pdf"] as const;

// ===========================
// DEBOUNCE TIMINGS
// ===========================

/** Debounce delay for saving reading state (page/zoom) in milliseconds */
export const DEBOUNCE_SAVE_STATE_MS = 500;

/** Debounce delay for retrying dark mode filter application in milliseconds */
export const DEBOUNCE_RETRY_DARK_MODE_MS = 200;
