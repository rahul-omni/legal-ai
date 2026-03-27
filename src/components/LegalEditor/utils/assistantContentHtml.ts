"use client";

import DOMPurify from "dompurify";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:html|markdown|md)?\s*\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();
}

/**
 * Renders assistant text as Markdown (bold, lists, etc.) then sanitizes HTML.
 * Use for chat bubbles and preview — avoids raw `**` asterisks from the model.
 */
export function assistantContentToSafeHtml(raw: string): string {
  const cleaned = stripCodeFences(raw).trim();
  if (!cleaned) return "";
  const html = marked.parse(cleaned, { async: false }) as string;
  return DOMPurify.sanitize(html);
}
