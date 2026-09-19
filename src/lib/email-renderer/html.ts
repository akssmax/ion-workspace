/**
 * Email body extraction and safe rendering for the reading pane.
 */

import type { EmailProperties } from "../../jmap/types/mail"
import { sanitizeEmailHtml } from "./sanitize"
import { escapeHtml, htmlToText } from "./plaintext"

/** First text value for a body part within `bodyValues`. */
export function bodyPartValue(
  email: EmailProperties,
  part: { partId?: string | null } | undefined
): string | undefined {
  if (!part?.partId) return undefined
  return email.bodyValues?.[part.partId]?.value
}

/** The HTML body (rendered) of an email, if any. */
export function emailHtmlBody(email: EmailProperties): string | undefined {
  const html = email.htmlBody?.[0]
  return html ? bodyPartValue(email, html) : undefined
}

/** The plain-text body of an email, falling back to HTML->text. */
export function emailTextBody(email: EmailProperties): string {
  const text = email.textBody?.[0]
  if (text) {
    const value = bodyPartValue(email, text)
    if (value) return value
  }
  const html = emailHtmlBody(email)
  if (html) return htmlToText(html)
  return email.preview ?? ""
}

/**
 * Render a safe HTML string for the reading pane, preferring the HTML body.
 * Sanitization is mandatory and happens here — never bypass.
 */
export function renderEmailBody(email: EmailProperties): string {
  const html = emailHtmlBody(email)
  if (html) return sanitizeEmailHtml(html)
  const plain = emailTextBody(email)
  return `<div style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(plain)}</div>`
}

export function senderName(email: EmailProperties): string {
  const from = email.from?.[0]
  if (!from) return "Unknown sender"
  return from.name || from.email
}

export function senderEmail(email: EmailProperties): string | undefined {
  return email.from?.[0]?.email
}
