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
    (input: unknown) => input as { username?: string; password?: string }
  )
  .handler(
    async ({ data }: { data?: { username?: string; password?: string } }) => {
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

      // Real mode: exchange credentials with Stalwart for a session JWT.
      let token: string
      try {
        const response = await fetch(WORKSPACE_CONFIG.authPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        })
        if (!response.ok) {
          throw new Error(
            `Stalwart authentication failed (${response.status}).`
          )
        }
        const body = (await response.json()) as { token?: string }
        token = body.token ?? ""
        if (!token) throw new Error("Stalwart did not return a session token.")
      } catch (error) {
        if (error instanceof Error && /Stalwart/.test(error.message))
          throw error
        throw new Error(
          "Could not reach the mail server. Please try again later."
        )
      }

      const email = username.includes("@") ? username : `${username}@mail.local`
      const session: SessionData = {
        userId: `real-${username}`,
        username,
        email,
        mode: "real",
        accessToken: token,
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
