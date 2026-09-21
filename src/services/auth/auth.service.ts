/**
 * Auth domain service. The only place UI code talks to the auth boundary.
 */

import {
  getAuthSession,
  getAppConfig,
  login,
  logout,
} from "../../server/auth.rpc"
import type { SessionInfo } from "../../server/auth.rpc"
import { isDemoRuntime, DEMO_SESSION } from "@/lib/demo/runtime"

export async function fetchSession(): Promise<SessionInfo | null> {
  return isDemoRuntime ? DEMO_SESSION : getAuthSession()
}

export async function fetchAppConfig(): Promise<{
  jmapMode: "mock" | "real"
  mockUsername: string | null
  mockPassword: string | null
}> {
  return getAppConfig()
}

export async function authenticate(
  username: string,
  password: string,
  mfaToken?: string
): Promise<SessionInfo> {
  // Harden against trivial empty submissions.
  const cleaned = username.trim()
  if (!cleaned || !password) {
    throw new Error("Username and password are required.")
  }
  const call = login as unknown as (input: {
    data: { username: string; password: string; mfaToken?: string }
  }) => Promise<SessionInfo>
  return call({ data: { username: cleaned, password, mfaToken } })
}

export async function signOut(): Promise<void> {
  if (isDemoRuntime) {
    window.location.assign("/")
    return
  }
  await logout()
  const { resetJmapClient } = await import("../jmap.service")
  resetJmapClient()
}
