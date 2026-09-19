/**
 * Query keys for all JMAP-backed resources.
 */

import { ACCOUNT_KEY } from "./client"

export const qk = {
  account: () => [ACCOUNT_KEY] as const,
  preferences: () => ["preferences"] as const,

  mailboxes: () => [ACCOUNT_KEY, "mailboxes"] as const,
  identities: () => [ACCOUNT_KEY, "identities"] as const,
  emails: (mailboxId: string, scope: string) =>
    [ACCOUNT_KEY, "emails", mailboxId, scope] as const,
  thread: (threadId: string) => [ACCOUNT_KEY, "thread", threadId] as const,
  search: (query: string) => [ACCOUNT_KEY, "search", query] as const,

  calendars: () => [ACCOUNT_KEY, "calendars"] as const,
  events: (calendarId: string | "all", start: string, end: string) =>
    [ACCOUNT_KEY, "events", calendarId, start, end] as const,

  addressBooks: () => [ACCOUNT_KEY, "addressbooks"] as const,
  contacts: (scope: string) => [ACCOUNT_KEY, "contacts", scope] as const,

  files: (parentId: string | null) =>
    [ACCOUNT_KEY, "files", parentId ?? "root"] as const,
} as const
