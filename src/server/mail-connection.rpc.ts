import { createServerFn } from "@tanstack/react-start"
import { getSession } from "./session.server"
import { WORKSPACE_CONFIG } from "./config.server"
import { activeStalwartToken } from "./stalwart-auth.server"

export interface MailConnectionStatus {
  mode: "mock" | "real"
  connected: boolean
  username: string
  accountId: string | null
  capabilities: string[]
  permissions: string[]
  error?: string
}

export const getMailConnectionStatus = createServerFn({ method: "GET" }).handler(async (): Promise<MailConnectionStatus> => {
  const session = await getSession()
  if (!session) return { mode: WORKSPACE_CONFIG.jmapMode, connected: false, username: "", accountId: null, capabilities: [], permissions: [], error: "Sign in to check the mail connection." }
  if (session.mode === "mock") return { mode: "mock", connected: true, username: session.username, accountId: session.accountId ?? null, capabilities: [], permissions: [] }
  try {
    const token = await activeStalwartToken()
    const headers = { Authorization: `Bearer ${token}` }
    const [sessionResponse, accountResponse] = await Promise.all([
      fetch(`${WORKSPACE_CONFIG.stalwartOrigin}/.well-known/jmap`, { headers, signal: AbortSignal.timeout(10000) }),
      fetch(`${WORKSPACE_CONFIG.stalwartOrigin}/api/account`, { headers, signal: AbortSignal.timeout(10000) }),
    ])
    if (!sessionResponse.ok) throw new Error(`JMAP discovery failed (${sessionResponse.status}).`)
    const jmap = await sessionResponse.json() as { capabilities?: Record<string, unknown>; primaryAccounts?: Record<string, string> }
    const account = accountResponse.ok ? await accountResponse.json() as { permissions?: string[] } : null
    return { mode: "real", connected: true, username: session.username, accountId: jmap.primaryAccounts?.["urn:ietf:params:jmap:mail"] ?? null, capabilities: Object.keys(jmap.capabilities ?? {}), permissions: account?.permissions ?? [] }
  } catch (error) {
    return { mode: "real", connected: false, username: session.username, accountId: session.accountId ?? null, capabilities: [], permissions: [], error: error instanceof Error ? error.message : "Could not reach Stalwart." }
  }
})
