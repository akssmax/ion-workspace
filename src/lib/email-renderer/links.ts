/**
 * Link safety helpers for rendered email content.
 */

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:", "cid:"])

/**
 * True when a URL is safe to render/navigate to. Blocks javascript:,
 * vbscript:, data:text/html and friends. Relative URLs are allowed.
 */
export function isSafeUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  if (trimmed.startsWith("#") || trimmed.startsWith("/")) return true
  // data: only for images
  if (/^data:image\//i.test(trimmed)) return true
  try {
    const parsed = new URL(trimmed)
    return SAFE_PROTOCOLS.has(parsed.protocol)
  } catch {
    // Unparseable → treat as relative, allow.
    return !/^[a-z][a-z0-9+.-]*:/i.test(trimmed)
  }
}

/** Strip unsafe hrefs from an HTML string (no-DOM fallback helper). */
export function stripUnsafeLinks(html: string): string {
  return html.replace(
    /<a\s([^>]*?)href=(["'])(.*?)\2/gi,
    (match, attrs: string, _quote: string, href: string) =>
      isSafeUrl(href) ? match : `<a ${attrs}`
  )
}
