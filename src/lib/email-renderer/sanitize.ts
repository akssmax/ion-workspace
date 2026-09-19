/**
 * Email HTML sanitizer — the mandatory gate before any email body reaches
 * `dangerouslySetInnerHTML`.
 *
 * Browser: DOMPurify with an email-specific profile (no script/style/
 * iframe/form, no event handlers, no javascript: URLs, links hardened with
 * target=_blank rel=noopener, 1x1 tracking pixels stripped).
 *
 * No-DOM (SSR / tests): conservative regex fallback that strips dangerous
 * tags and event-handler attributes.
 */

import DOMPurify from "dompurify"

/** Tags never allowed in rendered email bodies. */
const FORBID_TAGS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "link",
  "meta",
  "base",
]

/** Attributes never allowed (in addition to DOMPurify's defaults). */
const FORBID_ATTR = ["srcdoc", "formaction"]

let hooksRegistered = false

function registerHooks(): void {
  if (hooksRegistered) return
  hooksRegistered = true

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    // Harden links: open externally, never leak referrer/opener.
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank")
      node.setAttribute("rel", "noopener noreferrer nofollow")
    }
    // Strip likely tracking pixels (1x1 images).
    if (node.tagName === "IMG") {
      const w = node.getAttribute("width")
      const h = node.getAttribute("height")
      const tiny = (v: string | null) => v != null && Number(v) <= 1
      if ((tiny(w) && tiny(h)) || node.getAttribute("height") === "0") {
        node.remove()
      }
    }
  })
}

/**
 * Sanitize an email HTML body. ALWAYS use this (or `renderEmailBody`) before
 * rendering email content.
 */
export function sanitizeEmailHtml(dirty: string): string {
  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    registerHooks()
    return DOMPurify.sanitize(dirty, {
      FORBID_TAGS,
      FORBID_ATTR,
      ALLOW_DATA_ATTR: true,
    })
  }
  return fallbackSanitize(dirty)
}

/** No-DOM fallback: strip dangerous tags and on* attributes. */
function fallbackSanitize(dirty: string): string {
  const withoutTags = dirty
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<(object|embed|form|link|meta|base)[^>]*>/gi, "")
  return withoutTags
    .replace(/\s(on\w+)=(["'])[^"']*\2/gi, "")
    .replace(/\s(on\w+)=([^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
}
