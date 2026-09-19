/**
 * User preferences RPC boundary.
 *
 * Stored inside the encrypted session cookie for now (single-profile).
 * Swap for a profile store in multi-account.
 *
 * Like the other `*.rpc.ts` modules, this file deliberately does NOT use a
 * `.server.*` suffix so client code can import it without tripping
 * TanStack's import-protection fences; the underlying server-only logic
 * (session cookie storage) lives in `.server.ts` modules that only run
 * server-side.
 */

import { createServerFn } from "@tanstack/react-start"
import { getSession, requireSession, updateSession } from "./session.server"
import { mailMetadataPool } from "./mail-metadata.server"
import type { InboxLayoutPrefs } from "../lib/inbox-layout"

export interface UserPreferences {
  swipeLeftAction?: "archive" | "trash" | "read" | "star" | "none"
  swipeRightAction?: "archive" | "trash" | "read" | "star" | "none"
  language?: string
  timezone?: string
  calendarWeekStart?: "locale" | "sunday" | "monday" | "saturday"
  signatureText?: string
  signatures?: Record<string, { text?: string; html?: string }>
  displayDensity?: "comfortable" | "compact"
  defaultView?: string
  readingPane?: InboxLayoutPrefs["readingPane"]
  listDensity?: InboxLayoutPrefs["listDensity"]
  showSnippets?: boolean
  /** Feature-flag overrides: feature id -> enabled. Absent = registry default. */
  features?: Record<string, boolean>
  messageActionsPosition?: "top" | "bottom"
  remoteImages?: "never" | "trusted" | "always"
  trustedImageSenders?: string[]
  defaultIdentityId?: string
  replyDefault?: "reply" | "reply-all"
  signaturePlacement?: "above" | "below"
  emlFilenameTemplate?: string
  attachmentFilenameTemplate?: string
  zipFilenameTemplate?: string
  filenameSpaces?: "keep" | "dash" | "underscore"
}

function scope(session: { userId: string; accountId?: string }): [string, string] {
  return [session.userId, session.accountId ?? "primary"]
}

async function readStoredPreferences(session: { userId: string; accountId?: string; prefs?: unknown }): Promise<UserPreferences> {
  const database = mailMetadataPool()
  if (!database) return session.prefs ?? {}
  const result = await database.query<{ data: UserPreferences }>(
    "SELECT data FROM user_preferences WHERE user_id = $1 AND account_id = $2", scope(session)
  )
  if (result.rows[0]) return result.rows[0].data
  const previous = (session.prefs as UserPreferences | undefined) ?? {}
  if (Object.keys(previous).length) {
    await database.query(
      "INSERT INTO user_preferences (user_id, account_id, data) VALUES ($1, $2, $3::jsonb) ON CONFLICT DO NOTHING",
      [...scope(session), JSON.stringify(previous)]
    )
    await updateSession({ prefs: undefined })
  }
  return previous
}

export const getPreferences = createServerFn({ method: "GET" }).handler(
  async (): Promise<UserPreferences> => {
    const session = await getSession()
    return session ? readStoredPreferences(session) : {}
  }
)

export const savePreferences = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as UserPreferences)
  .handler(async ({ data }: { data?: UserPreferences }) => {
    const session = await requireSession()
    const preferences = data ?? {}
    if (JSON.stringify(preferences).length > 32000) throw new Error("Preferences are too large.")
    const database = mailMetadataPool()
    if (database) {
      await database.query(
        `INSERT INTO user_preferences (user_id, account_id, data) VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (user_id, account_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
        [...scope(session), JSON.stringify(preferences)]
      )
    } else if (session.mode === "mock") {
      await updateSession({ prefs: preferences })
    } else {
      throw new Error("DATABASE_URL is required to save account settings.")
    }
    return { ok: true }
  })
