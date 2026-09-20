/**
 * Server-side session management.
 *
 * Sessions use TanStack Start's encrypted HTTP-only cookie session manager.
 * The payload (including the Stalwart JWT in real mode) is sealed server-side
 * and never exposed to client JavaScript.
 */

import {
  getSession as readSession,
  useSession,
  type SessionConfig,
} from "@tanstack/react-start/server"

export interface SessionData {
  userId: string
  username: string
  email: string
  mode: "mock" | "real"
  /** Stalwart session JWT (oauth real mode only). Never sent to the client. */
  accessToken?: string
  refreshToken?: string
  accessTokenExpiresAt?: number
  /** HTTP authorization scheme used for the mail server. */
  authScheme?: "Bearer" | "Basic"
  /** Base64 `username:password` for basic-auth real mode. Never sent to the client. */
  basicAuth?: string
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
    // useSession creates and commits an empty cookie for anonymous requests.
    // A late anonymous response can overwrite the cookie from a concurrent login.
    const data = (await readSession<SessionData>(sessionConfig)).data
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
