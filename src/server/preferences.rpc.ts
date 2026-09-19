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
import { getSession, setSession } from "./session.server"
import type { InboxLayoutPrefs } from "../lib/inbox-layout"

export interface UserPreferences {
  language?: string
  timezone?: string
  signatureText?: string
  signatures?: Record<string, { text?: string; html?: string }>
  displayDensity?: "comfortable" | "compact"
  defaultView?: string
  readingPane?: InboxLayoutPrefs["readingPane"]
  listDensity?: InboxLayoutPrefs["listDensity"]
  showSnippets?: boolean
  /** Feature-flag overrides: feature id -> enabled. Absent = registry default. */
  features?: Record<string, boolean>
}

export const getPreferences = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await getSession()
    return (session?.prefs as UserPreferences | undefined) ?? {}
  }
)

export const savePreferences = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as UserPreferences)
  .handler(async ({ data }: { data?: UserPreferences }) => {
    const session = await getSession()
    if (!session) throw new Error("Not authenticated.")
    await setSession({ ...session, prefs: data ?? {} })
    return { ok: true }
  })
