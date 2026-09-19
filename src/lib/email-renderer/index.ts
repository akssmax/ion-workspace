/**
 * email-renderer — the canonical module for turning raw email bodies into
 * safe, renderable content. Rendering email HTML anywhere else (or skipping
 * `sanitizeEmailHtml`) is a security bug.
 */

export { sanitizeEmailHtml } from "./sanitize"
export { htmlToText, escapeHtml, quoteText } from "./plaintext"
export { isSafeUrl, stripUnsafeLinks } from "./links"
export {
  blockRemoteImages,
  allowRemoteImages,
  rewriteCidImages,
} from "./images"
export { emailHasAttachments, attachmentsOf } from "./attachments"
export { collapseQuotedSections } from "./quote-collapse"
export {
  bodyPartValue,
  emailHtmlBody,
  emailTextBody,
  renderEmailBody,
  senderName,
  senderEmail,
} from "./html"
