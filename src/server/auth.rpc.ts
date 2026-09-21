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
import { destroySession, getSession, setSession } from "./session.server"
import type { SessionData } from "./session.server"
import { WORKSPACE_CONFIG } from "./config.server"
import {
  authenticateStalwart,
  authenticateStalwartBasic,
} from "./stalwart-auth.server"

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
    (input: unknown) =>
      input as { username?: string; password?: string; mfaToken?: string }
  )
  .handler(
    async ({
      data,
    }: {
      data?: { username?: string; password?: string; mfaToken?: string }
    }) => {
      const username = data?.username?.trim()
      const password = data?.password ?? ""
      if (!username || !password) {
        throw new Error("Username and password are required.")
      }

      if (WORKSPACE_CONFIG.jmapMode === "mock") {
        const validUsername =
          username === WORKSPACE_CONFIG.mockUsername ||
          username === WORKSPACE_CONFIG.mockEmail
        if (!validUsername || password !== WORKSPACE_CONFIG.mockPassword) {
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

      // Real mode: validate credentials and obtain a server-side auth token.
      if (WORKSPACE_CONFIG.stalwartAuthMode === "basic") {
        const basic = await authenticateStalwartBasic(username, password)
        const session: SessionData = {
          userId: `real-${WORKSPACE_CONFIG.stalwartOrigin}:${basic.accountId}`,
          username: basic.username,
          email: basic.username.includes("@") ? basic.username : username,
          mode: "real",
          accountId: basic.accountId,
          authScheme: "Basic",
          basicAuth: basic.basicAuth,
        }
        await setSession(session)
        return sdToPublic(session)
      }

      // OAuth mode: exchange the Stalwart authorization code for OAuth tokens.
      let tokens: Awaited<ReturnType<typeof authenticateStalwart>>
      try {
        tokens = await authenticateStalwart(username, password, data?.mfaToken)
      } catch (error) {
        if (
          error instanceof Error &&
          /Stalwart|second factor|expired/.test(error.message)
        )
          throw error
        throw new Error(
          "Could not reach the mail server. Please try again later."
        )
      }

      const discovery = await fetch(
        `${WORKSPACE_CONFIG.stalwartOrigin}/.well-known/jmap`,
        {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
          signal: AbortSignal.timeout(15_000),
        }
      )
      if (!discovery.ok)
        throw new Error(`Stalwart JMAP discovery failed (${discovery.status}).`)
      const jmap = (await discovery.json()) as {
        username?: string
        primaryAccounts?: Record<string, string>
      }
      const accountId = jmap.primaryAccounts?.["urn:ietf:params:jmap:mail"]
      if (!accountId)
        throw new Error(
          "This Stalwart account does not provide JMAP mail access."
        )
      const canonicalName = jmap.username || username
      const email = canonicalName.includes("@") ? canonicalName : username
      const session: SessionData = {
        userId: `real-${WORKSPACE_CONFIG.stalwartOrigin}:${accountId}`,
        username: canonicalName,
        email,
        mode: "real",
        accountId,
        authScheme: "Bearer",
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
    const isMock = WORKSPACE_CONFIG.jmapMode === "mock"
    return {
      jmapMode: WORKSPACE_CONFIG.jmapMode,
      // Demo credentials are only advertised while the server runs mock mode.
      mockUsername: isMock ? WORKSPACE_CONFIG.mockUsername : null,
      mockPassword: isMock ? WORKSPACE_CONFIG.mockPassword : null,
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
