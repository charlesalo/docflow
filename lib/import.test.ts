import { describe, expect, it } from "vitest";
import { fileTextToDocumentHtml, getExtension, isSupportedImportFile } from "@/lib/import";

describe("isSupportedImportFile", () => {
  it("accepts .txt and .md files", () => {
    expect(isSupportedImportFile("notes.txt")).toBe(true);
    expect(isSupportedImportFile("notes.MD")).toBe(true);
  });

  it("rejects other file types", () => {
    expect(isSupportedImportFile("resume.docx")).toBe(false);
    expect(isSupportedImportFile("photo.png")).toBe(false);
    expect(isSupportedImportFile("noextension")).toBe(false);
  });
});

describe("getExtension", () => {
  it("returns the lowercased extension including the dot", () => {
    expect(getExtension("Report.MD")).toBe(".md");
    expect(getExtension("archive.tar.gz")).toBe(".gz");
  });
});

describe("fileTextToDocumentHtml", () => {
  it("converts markdown headings and lists into HTML", () => {
    const html = fileTextToDocumentHtml("# Title\n\n- one\n- two", ".md");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<li>two</li>");
  });

  it("wraps plain text paragraphs in <p> tags", () => {
    const html = fileTextToDocumentHtml("First paragraph.\n\nSecond paragraph.", ".txt");
    expect(html).toContain("<p>First paragraph.</p>");
    expect(html).toContain("<p>Second paragraph.</p>");
  });

  it("strips scripts and dangerous markup from imported markdown", () => {
    const html = fileTextToDocumentHtml("<script>alert(1)</script>\n\nSafe text.", ".md");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("alert(1)");
    expect(html).toContain("Safe text.");
  });

  it("escapes HTML-looking plain text instead of executing it", () => {
    const html = fileTextToDocumentHtml("<img src=x onerror=alert(1)>", ".txt");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});
