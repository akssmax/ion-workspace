/**
 * Authentication RPC boundary.
 *
 * These are the only `createServerFn` functions the client may import for
 * auth. The module deliberately does NOT use a `.server.*` suffix so client
 * code can import it without tripping TanStack's import-protection fences;
 * the underlying server-only logic (session cookie storage, config) lives in
 * `.server.ts` modules that only run server-side.
 *
 * Domain rule: JMAP credentials and tokens never leave the server.
 */

import { createServerFn } from "@tanstack/react-start"
import {
  destroySession,
  getSession,
  setSession,
  type SessionData,
} from "./session.server"
import { WORKSPACE_CONFIG } from "./config.server"
import { authenticateStalwart } from "./stalwart-auth.server"

export interface SessionInfo {
  userId: string
  username: string
  email: string
  mode: "mock" | "real"
  accountId?: string
}

async function readPublicSession(): Promise<SessionInfo | null> {
  const session = await getSession()
  if (!session) return null
  return sdToPublic(session)
}

export const login = createServerFn({ method: "POST" })
  .validator(
    (input: unknown) => input as { username?: string; password?: string; mfaToken?: string }
  )
  .handler(
    async ({ data }: { data?: { username?: string; password?: string; mfaToken?: string } }) => {
      const username = data?.username?.trim()
      const password = data?.password ?? ""
      if (!username || !password) {
        throw new Error("Username and password are required.")
      }

      if (WORKSPACE_CONFIG.jmapMode === "mock") {
        if (
          username !== WORKSPACE_CONFIG.mockUsername &&
          username !== WORKSPACE_CONFIG.mockEmail
        ) {
          throw new Error("Invalid username or password.")
        }
        const session: SessionData = {
          userId: `mock-${username}`,
          username,
          email: WORKSPACE_CONFIG.mockEmail,
          mode: "mock",
          accountId: "a1",
        }
        await setSession(session)
        return sdToPublic(session)
      }

      // Real mode: exchange the Stalwart authorization code for OAuth tokens.
      let tokens: Awaited<ReturnType<typeof authenticateStalwart>>
      try {
        tokens = await authenticateStalwart(username, password, data?.mfaToken)
      } catch (error) {
        if (error instanceof Error && /Stalwart|second factor|expired/.test(error.message))
          throw error
        throw new Error(
          "Could not reach the mail server. Please try again later."
        )
      }

      const discovery = await fetch(`${WORKSPACE_CONFIG.stalwartOrigin}/.well-known/jmap`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        signal: AbortSignal.timeout(15_000),
      })
      if (!discovery.ok) throw new Error(`Stalwart JMAP discovery failed (${discovery.status}).`)
      const jmap = await discovery.json() as { username?: string; primaryAccounts?: Record<string, string> }
      const accountId = jmap.primaryAccounts?.["urn:ietf:params:jmap:mail"]
      if (!accountId) throw new Error("This Stalwart account does not provide JMAP mail access.")
      const canonicalName = jmap.username || username
      const email = canonicalName.includes("@") ? canonicalName : username
      const session: SessionData = {
        userId: `real-${WORKSPACE_CONFIG.stalwartOrigin}:${accountId}`,
        username: canonicalName,
        email,
        mode: "real",
        accountId,
        ...tokens,
      }
      await setSession(session)
      return sdToPublic(session)
    }
  )

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  await destroySession()
  return { ok: true }
})

export const getAuthSession = createServerFn({ method: "GET" }).handler(
  async () => {
    return readPublicSession()
  }
)

export const getAppConfig = createServerFn({ method: "GET" }).handler(
  async () => {
    return {
      jmapMode: WORKSPACE_CONFIG.jmapMode,
      mockUsername: WORKSPACE_CONFIG.mockUsername,
      mockPassword: WORKSPACE_CONFIG.mockPassword,
      publicEventSourceUrl: WORKSPACE_CONFIG.publicEventSourceUrl,
    }
  }
)

function sdToPublic(session: SessionData): SessionInfo {
  return {
    userId: session.userId,
    username: session.username,
    email: session.email,
    mode: session.mode,
    accountId: session.accountId,
  }
}

export type { SessionInfo as AuthSession }
