/**
 * Server-side configuration. Safe defaults for development (mock mode,
 * no Stalwart required). Import this only from server code.
 */

export type JmapMode = "mock" | "real"

export interface WorkspaceConfig {
  /** Which JMAP provider the app should use. */
  jmapMode: JmapMode
  /**
   * Base origin of the Stalwart server. Used both for the JMAP HTTP
   * endpoints and the legacy auth exchange.
   */
  stalwartOrigin: string
  /** JMAP endpoint appended to stalwartOrigin. */
  jmapPath: string
  /** Where to POST username/password to obtain a session JWT. */
  authPath: string
  /** Session cookie name. */
  sessionCookieName: string
  /** Session lifetime in seconds. */
  sessionTtlSeconds: number
  /** When set (https://...) the browser connects to this SSE URL directly. */
  publicEventSourceUrl: string | null
  /** Identity used for mock accounts. */
  mockUsername: string
  mockPassword: string
  mockEmail: string
}

function boolFromEnv(name: string, def = false): boolean {
  const value = process.env[name]
  if (value === undefined) return def
  return value === "1" || value.toLowerCase() === "true"
}

export function getConfig(): WorkspaceConfig {
  const stalwartOrigin =
    process.env.JMAP_STALWART_ORIGIN ?? "http://localhost:8080"
  return {
    jmapMode: boolFromEnv("JMAP_MODE", false) ? "real" : "mock",
    stalwartOrigin,
    jmapPath: `${stalwartOrigin}/jmap`,
    authPath: `${stalwartOrigin}/api/authenticate`,
    sessionCookieName: "wt_session",
    sessionTtlSeconds: Number(
      process.env.SESSION_TTL_SECONDS ?? 60 * 60 * 24 * 14
    ),
    publicEventSourceUrl: process.env.JMAP_PUBLIC_EVENT_SOURCE_URL ?? null,
    mockUsername: process.env.MOCK_USERNAME ?? "demo",
    mockPassword: process.env.MOCK_PASSWORD ?? "demo",
    mockEmail: process.env.MOCK_EMAIL ?? "demo@workspace.local",
  }
}

export const WORKSPACE_CONFIG = getConfig()
