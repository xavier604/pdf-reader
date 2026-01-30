import { describe, expect, it } from "vitest";
import { formatFileSize, formatRelativeDate, truncateFileName } from "./utils";

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(512)).toBe("512 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(10240)).toBe("10 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(1048576)).toBe("1.0 MB");
    expect(formatFileSize(5242880)).toBe("5.0 MB");
  });

  it("formats gigabytes", () => {
    expect(formatFileSize(1073741824)).toBe("1.0 GB");
  });
});

describe("formatRelativeDate", () => {
  it("returns 'just now' for recent timestamps", () => {
    expect(formatRelativeDate(Date.now())).toBe("just now");
    expect(formatRelativeDate(Date.now() - 30_000)).toBe("just now");
  });

  it("returns minutes ago", () => {
    expect(formatRelativeDate(Date.now() - 60_000)).toBe("1 minute ago");
    expect(formatRelativeDate(Date.now() - 300_000)).toBe("5 minutes ago");
  });

  it("returns hours ago", () => {
    expect(formatRelativeDate(Date.now() - 3_600_000)).toBe("1 hour ago");
    expect(formatRelativeDate(Date.now() - 7_200_000)).toBe("2 hours ago");
  });

  it("returns days ago", () => {
    expect(formatRelativeDate(Date.now() - 86_400_000)).toBe("1 day ago");
    expect(formatRelativeDate(Date.now() - 3 * 86_400_000)).toBe("3 days ago");
  });

  it("returns formatted date for older timestamps", () => {
    const old = new Date("2024-03-15T12:00:00Z").getTime();
    const result = formatRelativeDate(old);
    expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
  });
});

describe("truncateFileName", () => {
  it("returns short names unchanged", () => {
    expect(truncateFileName("test.pdf")).toBe("test.pdf");
  });

  it("truncates long names with ellipsis", () => {
    const longName = "a".repeat(50);
    const result = truncateFileName(longName, 20);
    expect(result.length).toBe(20);
    expect(result).toContain("...");
  });

  it("preserves start and end of name", () => {
    const result = truncateFileName("abcdefghijklmnopqrstuvwxyz", 10);
    expect(result.startsWith("abcd")).toBe(true);
    expect(result.endsWith("xyz")).toBe(true);
  });
});
