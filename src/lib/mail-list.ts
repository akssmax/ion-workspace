import type { EmailFilterOperator, EmailSortComparator } from "@/jmap/types/mail"

export type MailSort = "newest" | "oldest" | "correspondent-asc" | "correspondent-desc" | "subject-asc" | "subject-desc" | "largest" | "smallest"
export type MailQuickFilter = "unread" | "starred" | "attachment"

export const MAIL_SORT_OPTIONS: { value: MailSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "correspondent-asc", label: "Correspondent A–Z" },
  { value: "correspondent-desc", label: "Correspondent Z–A" },
  { value: "subject-asc", label: "Subject A–Z" },
  { value: "subject-desc", label: "Subject Z–A" },
  { value: "largest", label: "Largest first" },
  { value: "smallest", label: "Smallest first" },
]

export const MAIL_QUICK_FILTERS: { value: MailQuickFilter; label: string; clause: EmailFilterOperator }[] = [
  { value: "unread", label: "Unread", clause: { notKeyword: "$seen" } },
  { value: "starred", label: "Starred", clause: { hasKeyword: "$flagged" } },
  { value: "attachment", label: "Has attachment", clause: { hasAttachment: true } },
]

export function mailSortComparators(sort: MailSort, sent = false, supported?: readonly string[]): EmailSortComparator[] {
  const date = sent && (!supported || supported.includes("sentAt")) ? "sentAt" : "receivedAt"
  switch (sort) {
    case "newest": return [{ property: date, isAscending: false }]
    case "oldest": return [{ property: date, isAscending: true }]
    case "correspondent-asc":
    case "correspondent-desc": return [{ property: sent ? "to" : "from", isAscending: sort === "correspondent-asc" }, { property: date, isAscending: false }]
    case "subject-asc":
    case "subject-desc": return [{ property: "subject", isAscending: sort === "subject-asc" }, { property: date, isAscending: false }]
    case "largest":
    case "smallest": return [{ property: "size", isAscending: sort === "smallest" }, { property: date, isAscending: false }]
  }
}

export function combineMailFilters(...filters: (EmailFilterOperator | null | undefined)[]): EmailFilterOperator | undefined {
  const conditions = filters.filter((filter): filter is EmailFilterOperator => !!filter)
  return conditions.length > 1 ? { operator: "AND", conditions } : conditions[0]
}
