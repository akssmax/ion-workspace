import { createServerFn } from "@tanstack/react-start"
import { getSession } from "./session.server"
import { WORKSPACE_CONFIG } from "./config.server"
import { activeStalwartAuthorization } from "./stalwart-auth.server"

export interface MailQuota {
  id: string
  resourceType: string
  used: number
  hardLimit: number | null
  softLimit: number | null
  warnLimit: number | null
  scope: string
  name: string
  types: string[]
}

export interface MailConnectionStatus {
  mode: "mock" | "real"
  connected: boolean
  username: string
  accountId: string | null
  capabilities: string[]
  permissions: string[]
  quotas: MailQuota[]
  error?: string
}

const QUOTA_CAPABILITY = "urn:ietf:params:jmap:quota"
const CORE_CAPABILITY = "urn:ietf:params:jmap:core"

/** Representative limits so the demo account can exercise the usage UI. */
const MOCK_QUOTAS: MailQuota[] = [
  {
    id: "mock-storage",
    resourceType: "octets",
    used: 2_684_354_560,
    hardLimit: 10_737_418_240,
    softLimit: null,
    warnLimit: 9_663_676_416,
    scope: "account",
    name: "Storage",
    types: ["Email", "Calendar", "Contact", "FileNode"],
  },
  {
    id: "mock-messages",
    resourceType: "count",
    used: 4_128,
    hardLimit: 25_000,
    softLimit: null,
    warnLimit: null,
    scope: "account",
    name: "Messages",
    types: ["Email"],
  },
]

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function normalizeQuota(raw: unknown): MailQuota | null {
  if (!raw || typeof raw !== "object") return null
  const quota = raw as Record<string, unknown>
  if (typeof quota.id !== "string") return null
  return {
    id: quota.id,
    resourceType:
      typeof quota.resourceType === "string" ? quota.resourceType : "count",
    used: asNumber(quota.used) ?? 0,
    hardLimit: asNumber(quota.hardLimit),
    softLimit: asNumber(quota.softLimit),
    warnLimit: asNumber(quota.warnLimit),
    scope: typeof quota.scope === "string" ? quota.scope : "account",
    name: typeof quota.name === "string" ? quota.name : "",
    types: Array.isArray(quota.types)
      ? quota.types.filter((type): type is string => typeof type === "string")
      : [],
  }
}

/**
 * Fetch JMAP quotas (RFC 9425) for the account. Only the same-origin
 * `apiUrl` advertised by the session is contacted with the session
 * credential. Failures degrade to an empty list so the connection check
 * still reports status.
 */
async function fetchQuotas(
  apiUrl: unknown,
  accountId: string | null,
  token: string
): Promise<MailQuota[]> {
  if (typeof apiUrl !== "string" || !apiUrl || !accountId) return []
  let endpoint: URL
  try {
    endpoint = new URL(apiUrl)
  } catch {
    return []
  }
  if (
    endpoint.origin !== new URL(WORKSPACE_CONFIG.stalwartOrigin).origin ||
    endpoint.username ||
    endpoint.password
  )
    return []
  try {
    const response = await fetch(endpoint.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({
        using: [CORE_CAPABILITY, QUOTA_CAPABILITY],
        methodCalls: [["Quota/get", { accountId, ids: null }, "q0"]],
      }),
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) return []
    const body = (await response.json()) as { methodResponses?: unknown[] }
    const call = (body.methodResponses ?? []).find(
      (entry): entry is [string, { list?: unknown[] }] =>
        Array.isArray(entry) && entry[0] === "Quota/get"
    )
    const list = call?.[1]?.list
    if (!Array.isArray(list)) return []
    return list
      .map(normalizeQuota)
      .filter((quota): quota is MailQuota => quota !== null)
  } catch {
    return []
  }
}

export const getMailConnectionStatus = createServerFn({
  method: "GET",
}).handler(async (): Promise<MailConnectionStatus> => {
  const session = await getSession()
  if (!session)
    return {
      mode: WORKSPACE_CONFIG.jmapMode,
      connected: false,
      username: "",
      accountId: null,
      capabilities: [],
      permissions: [],
      quotas: [],
      error: "Sign in to check the mail connection.",
    }
  if (session.mode === "mock")
    return {
      mode: "mock",
      connected: true,
      username: session.username,
      accountId: session.accountId ?? null,
      capabilities: [],
      permissions: [],
      quotas: MOCK_QUOTAS,
    }
  try {
    const token = await activeStalwartAuthorization()
    const headers = { Authorization: token }
    const [sessionResponse, accountResponse] = await Promise.all([
      fetch(`${WORKSPACE_CONFIG.stalwartOrigin}/.well-known/jmap`, {
        headers,
        signal: AbortSignal.timeout(10000),
      }),
      fetch(`${WORKSPACE_CONFIG.stalwartOrigin}/api/account`, {
        headers,
        signal: AbortSignal.timeout(10000),
      }),
    ])
    if (!sessionResponse.ok)
      throw new Error(`JMAP discovery failed (${sessionResponse.status}).`)
    const jmap = (await sessionResponse.json()) as {
      capabilities?: Record<string, unknown>
      apiUrl?: string
      primaryAccounts?: Record<string, string>
      accounts?: Record<string, unknown>
    }
    const account = accountResponse.ok
      ? ((await accountResponse.json()) as { permissions?: string[] })
      : null
    const accountId =
      jmap.primaryAccounts?.["urn:ietf:params:jmap:mail"] ??
      Object.keys(jmap.accounts ?? {}).at(0) ??
      null
    const quotas = jmap.capabilities?.[QUOTA_CAPABILITY]
      ? await fetchQuotas(jmap.apiUrl, accountId, token)
      : []
    return {
      mode: "real",
      connected: true,
      username: session.username,
      accountId,
      capabilities: Object.keys(jmap.capabilities ?? {}),
      permissions: account?.permissions ?? [],
      quotas,
    }
  } catch (error) {
    return {
      mode: "real",
      connected: false,
      username: session.username,
      accountId: session.accountId ?? null,
      capabilities: [],
      permissions: [],
      quotas: [],
      error:
        error instanceof Error ? error.message : "Could not reach Stalwart.",
    }
  }
})
