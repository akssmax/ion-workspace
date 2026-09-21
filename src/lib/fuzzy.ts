/**
 * Lightweight fuzzy matching for mail search.
 *
 * A term matches a field when it appears as a substring (with word-boundary
 * bonuses, so prefixes rank higher) or as an ordered subsequence, so partial
 * words and near-miss typos still surface results. Every term must match at
 * least one field (AND semantics); scores are summed and results are ranked by
 * relevance, then recency.
 */

import type { EmailProperties } from "@/jmap/types/mail"

const BOUNDARY = /[\s@._\-<>()[\]{}"'/:;,]/

/** Score one term against one string, or `null` when it doesn't match. */
export function scoreTerm(haystack: string, term: string): number | null {
  if (!term) return 0
  const hay = haystack.toLowerCase()
  const needle = term.toLowerCase()

  const index = hay.indexOf(needle)
  if (index !== -1) {
    const boundary = index === 0 || BOUNDARY.test(hay[index - 1])
    return 1000 - Math.min(index, 100) + (boundary ? 200 : 0)
  }

  let cursor = 0
  let score = 0
  let streak = 0
  for (const char of needle) {
    const found = hay.indexOf(char, cursor)
    if (found === -1) return null
    const boundary = found === 0 || BOUNDARY.test(hay[found - 1])
    streak = found === cursor ? streak + 1 : 0
    score += 10 + streak * 4 + (boundary ? 6 : 0) - Math.min(found - cursor, 16)
    cursor = found + 1
  }
  return score
}

interface ScoredField {
  weight: number
  value: (email: EmailProperties) => string
}

const FIELDS: ScoredField[] = [
  { weight: 3, value: (email) => email.subject ?? "" },
  {
    weight: 2.5,
    value: (email) =>
      (email.from ?? [])
        .map((address) => `${address.name ?? ""} ${address.email}`)
        .join(" "),
  },
  {
    weight: 1.5,
    value: (email) =>
      [...(email.to ?? []), ...(email.cc ?? []), ...(email.bcc ?? [])]
        .map((address) => `${address.name ?? ""} ${address.email}`)
        .join(" "),
  },
  { weight: 1, value: (email) => email.preview ?? "" },
]

/** Split a query into terms, keeping quoted phrases together. */
export function searchTerms(query: string): string[] {
  const matches =
    query
      .match(/"(?:[^"\\]|\\.)*"|[^\s]+/g)
      ?.map((token) => token.replace(/^"|"$/g, "").trim()) ?? []
  return matches.filter(Boolean)
}

/** Relevance score for an email, or `null` when any term fails to match. */
export function scoreEmail(
  email: EmailProperties,
  terms: string[]
): number | null {
  if (terms.length === 0) return 0
  let total = 0
  for (const term of terms) {
    let best: number | null = null
    for (const field of FIELDS) {
      const score = scoreTerm(field.value(email), term)
      if (score !== null) {
        const weighted = score * field.weight
        if (best === null || weighted > best) best = weighted
      }
    }
    if (best === null) return null
    total += best
  }
  return total
}

/** Filter and rank emails by fuzzy relevance to `query`. */
export function rankEmailsByQuery(
  emails: EmailProperties[],
  query: string
): EmailProperties[] {
  const terms = searchTerms(query)
  if (terms.length === 0) return emails
  return emails
    .map((email) => ({ email, score: scoreEmail(email, terms) }))
    .filter(
      (entry): entry is { email: EmailProperties; score: number } =>
        entry.score !== null
    )
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.email.receivedAt ?? "").localeCompare(a.email.receivedAt ?? "")
    )
    .map((entry) => entry.email)
}
