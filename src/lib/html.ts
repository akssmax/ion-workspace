/**
 * @deprecated Use `src/lib/email-renderer` instead. This shim re-exports the
 * canonical implementations for existing call sites and tests.
 */

export {
  bodyPartValue,
  emailHtmlBody,
  emailTextBody,
  renderEmailBody,
  senderName,
  senderEmail,
  emailHasAttachments,
  attachmentsOf,
  htmlToText,
  escapeHtml,
  quoteText,
  sanitizeEmailHtml as sanitizeHtml,
} from "./email-renderer"
