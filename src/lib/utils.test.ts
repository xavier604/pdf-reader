import { describe, expect, it } from "vitest";
import { formatFileSize, formatRelativeDate, truncateFileName } from "./utils";

describe("formatFileSize", () => {
  it("returns '0 B' for zero bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  it("formats values under 1024 as bytes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1023)).toBe("1023 B");
  });

  it("transitions to KB at exactly 1024 bytes", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
  });

  it("formats fractional KB correctly", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });

  it("omits decimal when value is >= 10", () => {
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
  it("returns 'just now' for timestamps under 60 seconds ago", () => {
    expect(formatRelativeDate(Date.now())).toBe("just now");
    expect(formatRelativeDate(Date.now() - 30_000)).toBe("just now");
    expect(formatRelativeDate(Date.now() - 59_000)).toBe("just now");
  });

  it("transitions to minutes at exactly 60 seconds ago", () => {
    expect(formatRelativeDate(Date.now() - 60_000)).toBe("1 minute ago");
    expect(formatRelativeDate(Date.now() - 300_000)).toBe("5 minutes ago");
  });

  it("transitions to hours at exactly 3600 seconds ago", () => {
    expect(formatRelativeDate(Date.now() - 3_600_000)).toBe("1 hour ago");
    expect(formatRelativeDate(Date.now() - 7_200_000)).toBe("2 hours ago");
  });

  it("transitions to days at exactly 86400 seconds ago", () => {
    expect(formatRelativeDate(Date.now() - 86_400_000)).toBe("1 day ago");
    expect(formatRelativeDate(Date.now() - 3 * 86_400_000)).toBe("3 days ago");
  });

  it("returns '7 days ago' at exactly 7 days", () => {
    expect(formatRelativeDate(Date.now() - 604_800_000)).toBe("7 days ago");
  });

  it("returns 'Mon DD' format for dates older than 7 days", () => {
    const old = Date.now() - 8 * 86_400_000;
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

  it("returns empty string for empty input", () => {
    expect(truncateFileName("")).toBe("");
  });

  it("returns string unchanged when exactly at maxLength", () => {
    const name = "a".repeat(40);
    expect(truncateFileName(name)).toBe(name);
    expect(truncateFileName(name, 40)).toBe(name);
  });

  it("truncates string that is 1 char over maxLength", () => {
    const name = "a".repeat(41);
    const result = truncateFileName(name);
    expect(result.length).toBe(40);
    expect(result).toContain("...");
  });

  it("respects custom maxLength parameter", () => {
    const name = "abcdefghijklmnopqrstuvwxyz";
    const result = truncateFileName(name, 10);
    expect(result.length).toBe(10);
    expect(result).toContain("...");
  });

  it("handles very short maxLength", () => {
    const name = "abcdefghij";
    const result = truncateFileName(name, 5);
    expect(result.length).toBe(5);
    expect(result).toContain("...");
  });
});
