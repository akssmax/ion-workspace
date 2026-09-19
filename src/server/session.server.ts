/**
 * Server-side session management.
 *
 * Sessions use TanStack Start's encrypted HTTP-only cookie session manager.
 * The payload (including the Stalwart JWT in real mode) is sealed server-side
 * and never exposed to client JavaScript.
 */

import { useSession, type SessionConfig } from "@tanstack/react-start/server"

export interface SessionData {
  userId: string
  username: string
  email: string
  mode: "mock" | "real"
  /** Stalwart session JWT (real mode only). Never sent to the client. */
  accessToken?: string
  refreshToken?: string
  accessTokenExpiresAt?: number
  /** Primary JMAP account id (resolved lazily). */
  accountId?: string
  /** UI preferences. */
  prefs?: unknown
}

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required in production.")
}
const SECRET =
  process.env.SESSION_SECRET ?? "workspace-tool-dev-secret-key-0123456789abc"

const sessionConfig: SessionConfig = {
  password: SECRET,
  maxAge: Number(process.env.SESSION_TTL_SECONDS ?? 60 * 60 * 24 * 14),
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const manager = await useSession<SessionData>(sessionConfig)
    const data = manager.data
    if (!data || !data.userId) return null
    return data as SessionData
  } catch {
    return null
  }
}

export async function requireSession(): Promise<SessionData> {
  const session = await getSession()
  if (!session) {
    throw new Error("A valid session is required.")
  }
  return session
}

export async function setSession(data: SessionData): Promise<void> {
  const manager = await useSession<SessionData>(sessionConfig)
  await manager.update(data)
}

export async function updateSession(
  patch: Partial<SessionData>
): Promise<void> {
  const manager = await useSession<SessionData>(sessionConfig)
  await manager.update((old) => ({
    ...(old ?? {}),
    ...patch,
    userId: old?.userId ?? "",
  }))
}

export async function destroySession(): Promise<void> {
  const manager = await useSession<SessionData>(sessionConfig)
  await manager.clear()
}
