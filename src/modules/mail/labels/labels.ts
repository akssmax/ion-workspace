/**
 * Label helpers. Labels are role-less mailboxes: applying a label adds the
 * email to that mailbox (JMAP multi-mailbox membership), so an email can
 * carry any number of labels while staying in its folder.
 */

import type { EmailProperties, Mailbox } from "@/jmap/types/mail"

export function isLabelMailbox(mailbox: Mailbox): boolean {
  return !mailbox.role
}

/** All label mailboxes, alphabetically. */
export function labelsOf(mailboxes: Mailbox[]): Mailbox[] {
  return mailboxes
    .filter(isLabelMailbox)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** The labels currently applied to an email. */
export function emailLabels(
  email: EmailProperties,
  mailboxes: Mailbox[]
): Mailbox[] {
  const ids = email.mailboxIds
  return labelsOf(mailboxes).filter((mb) => ids[mb.id])
}
