export function normalizePartiesDisplay(parties?: string | null) {
  if (!parties) return "";

  return parties
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\bversus\b/gi, " VS ")
    .replace(/\bv\.?\s*s\.?\b/gi, " VS ")
    // Some Supreme Court rows arrive as NAMEVSSTATE with no separators.
    .replace(/([A-Z])VS([A-Z])/g, "$1 VS $2")
    .replace(/\s+VS\s+/g, " VS ")
    .trim();
}
