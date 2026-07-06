import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

export const SUPPORTED_IMPORT_EXTENSIONS = [".txt", ".md"] as const;

export function getExtension(filename: string) {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx).toLowerCase();
}

export function isSupportedImportFile(filename: string) {
  return (SUPPORTED_IMPORT_EXTENSIONS as readonly string[]).includes(getExtension(filename));
}

// Converts an uploaded .txt or .md file's raw text into sanitized HTML
// suitable for loading straight into the Tiptap editor.
export function fileTextToDocumentHtml(text: string, extension: string): string {
  const raw = extension === ".md" ? (marked.parse(text, { async: false }) as string) : plainTextToHtml(text);
  return DOMPurify.sanitize(raw);
}

function plainTextToHtml(text: string): string {
  const paragraphs = text
    .split(/\r?\n\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return "<p></p>";

  return paragraphs
    .map((p) => `<p>${escapeHtml(p).replace(/\r?\n/g, "<br/>")}</p>`)
    .join("");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
