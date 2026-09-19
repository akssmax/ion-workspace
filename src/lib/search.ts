/**
 * Mailbox search query parser.
 *
 * Turns a human query into a JMAP EmailFilterCondition tree. Supports:
 *   from:user@example.com  to:  subject:  cc:  bcc:
 *   in:inbox | folder name  (mailbox, resolved by the query hook)
 *   has:attachment
 *   is:read | is:unread | is:starred | is:unstarred | is:important | is:draft
 *   after:2025-01-01   before:2026-06-01
 *   -term (excluded text), "exact phrase"
 * Everything else becomes a text match.
 */

import type {
  EmailFilterCondition,
  EmailFilterOperator,
} from "../jmap/types/mail"

export interface ParsedSearch {
  query: string
  filter: EmailFilterOperator | null
  /** Mailbox names targeted via `in:<name>`, resolved by the caller. */
  mailboxNames: string[]
  /** Whether anything beyond plain text matching is requested. */
  hasAdvanced: boolean
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2})?$/

function parseDateToken(token: string): string | null {
  const match = ISO_DATE_RE.exec(token.trim())
  if (!match) return null
  const date = token.trim().replace(" ", "T")
  return date.length === 10 ? `${date}T00:00:00Z` : `${date}Z`
}

export function parseSearch(input: string): ParsedSearch {
  const query = input.trim()
  if (!query)
    return { query: "", filter: null, mailboxNames: [], hasAdvanced: false }

  const conditions: EmailFilterOperator[] = []
  const mailboxNames: string[] = []
  const textMatches: string[] = []
  const negatedText: string[] = []
  let hasAdvanced = false

  const tokens =
    query.match(/[a-z]+:"(?:[^"\\]|\\.)*"|"(?:[^"\\]|\\.)*"|[^\s]+/gi) ?? []

  for (const raw of tokens) {
    const token = raw.replace(/^"|"$/g, "")

    if (token.startsWith("-") && token.length > 1) {
      negatedText.push(token.slice(1))
      hasAdvanced = true
      continue
    }

    const colon = token.indexOf(":")
    if (colon <= 0) {
      textMatches.push(token)
      continue
    }

    const field = token.slice(0, colon).toLowerCase()
    const value = token.slice(colon + 1).replace(/^"|"$/g, "")
    if (!value) continue

    if (field === "is") {
      hasAdvanced = true
      switch (value.toLowerCase()) {
        case "read":
          conditions.push({ hasKeyword: "$seen" })
          break
        case "unread":
          conditions.push({ notKeyword: "$seen" })
          break
        case "starred":
          conditions.push({ hasKeyword: "$flagged" })
          break
        case "unstarred":
          conditions.push({ notKeyword: "$flagged" })
          break
        case "important":
          conditions.push({ hasKeyword: "$important" })
          break
        case "draft":
        case "drafts":
          conditions.push({ hasKeyword: "$draft" })
          break
        default:
          textMatches.push(value)
      }
      continue
    }

    if (field === "has") {
      hasAdvanced = true
      if (value.toLowerCase() === "attachment") {
        conditions.push({ hasAttachment: true })
      }
      continue
    }

    if (field === "before" || field === "after") {
      const date = parseDateToken(value)
      if (date) {
        hasAdvanced = true
        conditions.push(field === "after" ? { after: date } : { before: date })
      }
      continue
    }

    if (field === "larger" || field === "smaller") {
      const bytes = Number(value)
      if (Number.isSafeInteger(bytes) && bytes >= 0) {
        hasAdvanced = true
        conditions.push(
          field === "larger" ? { minSize: bytes } : { maxSize: bytes }
        )
      }
      continue
    }

    if (field === "from") {
      hasAdvanced = true
      conditions.push({ from: value })
      continue
    }
    if (field === "to") {
      hasAdvanced = true
      conditions.push({ to: value })
      continue
    }
    if (field === "subject") {
      hasAdvanced = true
      conditions.push({ subject: value })
      continue
    }
    if (field === "cc") {
      hasAdvanced = true
      conditions.push({ cc: value })
      continue
    }
    if (field === "bcc") {
      hasAdvanced = true
      conditions.push({ bcc: value })
      continue
    }
    if (field === "in" || field === "label" || field === "folder") {
      hasAdvanced = true
      mailboxNames.push(value)
      continue
    }

    textMatches.push(token)
  }

  for (const term of negatedText) {
    conditions.push({ operator: "NOT", conditions: [{ text: term }] })
  }
  if (textMatches.length) {
    conditions.push({ text: textMatches.join(" ") })
  }

  const filter: EmailFilterOperator | null =
    conditions.length > 1
      ? { operator: "AND", conditions }
      : conditions.length === 1
        ? conditions[0]
        : null

  return { query, filter, mailboxNames, hasAdvanced }
}

/**
 * Combine a parsed filter with the mailbox context filter.
 */
export function filterForMailbox(
  parsed: ParsedSearch,
  mailboxId: string
): EmailFilterOperator {
  const mailboxClause: EmailFilterCondition = { inMailbox: mailboxId }
  if (!parsed.filter) return mailboxClause
  return { operator: "AND", conditions: [mailboxClause, parsed.filter] }
}
