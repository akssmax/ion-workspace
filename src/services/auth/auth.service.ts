/**
 * Auth domain service. The only place UI code talks to the auth boundary.
 */

import {
  getAuthSession,
  getAppConfig,
  login,
  logout,
  type SessionInfo,
} from "../../server/auth.rpc"
import { resetJmapClient } from "../jmap.service"

export async function fetchSession(): Promise<SessionInfo | null> {
  return getAuthSession()
}

export async function fetchAppConfig(): Promise<{
  jmapMode: "mock" | "real"
  mockUsername: string
  mockPassword: string
}> {
  return getAppConfig()
}

export async function authenticate(
  username: string,
  password: string
): Promise<SessionInfo> {
  // Harden against trivial empty submissions.
  const cleaned = username.trim()
  if (!cleaned || !password) {
    throw new Error("Username and password are required.")
  }
  const call = login as unknown as (input: {
    data: { username: string; password: string }
  }) => Promise<SessionInfo>
  return call({ data: { username: cleaned, password } })
}

export async function signOut(): Promise<void> {
  await logout()
  resetJmapClient()
}
