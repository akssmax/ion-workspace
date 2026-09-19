/**
 * Attachment helpers for email bodies.
 */

import type { EmailProperties } from "../../jmap/types/mail"

/** True when the email carries (or claims to carry) attachments. */
export function emailHasAttachments(email: EmailProperties): boolean {
  return !!email.hasAttachment || !!email.attachments?.length
}

/** The email's attachment parts (empty array when none). */
export function attachmentsOf(email: EmailProperties) {
  return email.attachments ?? []
}
