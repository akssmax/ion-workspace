/**
 * Plain-text helpers: HTML → text coercion, HTML escaping, reply quoting.
 * All functions work with or without a DOM (SSR-safe).
 */

/**
 * Coerce HTML to plain text without a DOM dependency (server + client).
 */
export function htmlToText(html: string): string {
  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html")
    return doc.body.textContent || html
  }
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/**
 * Escape <>&"' for safe injection into HTML strings.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Word-wrapped plain text for composer reply quoting.
 */
export function quoteText(body: string, attribution?: string): string {
  const lines = body
    .split("\n")
    .map((line) => (line.trim() ? `> ${line}` : ">"))
    .join("\n")
  return [attribution, lines].filter(Boolean).join("\n")
}
