import { createHash, randomBytes } from "node:crypto"
import { WORKSPACE_CONFIG } from "./config.server"
import { getSession, updateSession } from "./session.server"
import { currentQueuedCredentials } from "./mail-jobs.server"

type TokenResponse = { access_token?: string; refresh_token?: string; expires_in?: number; error?: string }

function verifier(): string { return randomBytes(32).toString("base64url") }

async function exchangeToken(params: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(WORKSPACE_CONFIG.oauthTokenPath, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
    signal: AbortSignal.timeout(15_000),
  })
  const data = await response.json().catch(() => ({})) as TokenResponse
  if (!response.ok || !data.access_token) throw new Error(data.error ?? `Stalwart token exchange failed (${response.status}).`)
  return data
}

export async function authenticateStalwart(username: string, password: string, mfaToken?: string) {
  const codeVerifier = verifier()
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url")
  const response = await fetch(WORKSPACE_CONFIG.authPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "authCode", accountName: username, accountSecret: password, mfaToken: mfaToken || null, clientId: WORKSPACE_CONFIG.oauthClientId, codeChallenge, codeChallengeMethod: "S256" }),
    signal: AbortSignal.timeout(15_000),
  })
  const result = await response.json().catch(() => ({})) as { type?: string; clientCode?: string; detail?: string }
  if (result.type === "mfaRequired") throw new Error("A second factor is required. Enter your authentication code and try again.")
  if (!response.ok || result.type !== "authenticated" || !result.clientCode) {
    throw new Error(result.detail ?? `Stalwart sign-in failed (${response.status}).`)
  }
  const token = await exchangeToken(new URLSearchParams({ grant_type: "authorization_code", code: result.clientCode, client_id: WORKSPACE_CONFIG.oauthClientId, code_verifier: codeVerifier }))
  return {
    accessToken: token.access_token!,
    refreshToken: token.refresh_token,
    accessTokenExpiresAt: Date.now() + Math.max(0, (token.expires_in ?? 3600) - 60) * 1000,
  }
}

/** Base64 `username:password` HTTP Basic credential. */
export function basicAuthCredentials(username: string, password: string): string {
  return Buffer.from(`${username}:${password}`, "utf8").toString("base64")
}

/**
 * Validate a username/password directly against the JMAP session endpoint
 * (Stalwart 1.0+ supports HTTP Basic auth on all JMAP endpoints) and return
 * the session fields needed to persist the login.
 */
export async function authenticateStalwartBasic(
  username: string,
  password: string
): Promise<{
  basicAuth: string
  accountId: string
  username: string
}> {
  let response: Response
  try {
    response = await fetch(`${WORKSPACE_CONFIG.stalwartOrigin}/.well-known/jmap`, {
      headers: {
        Authorization: `Basic ${basicAuthCredentials(username, password)}`,
      },
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    throw new Error("Could not reach the mail server. Please try again later.")
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error("Invalid username or password.")
  }
  if (!response.ok) {
    throw new Error(`Stalwart JMAP discovery failed (${response.status}).`)
  }
  const jmap = (await response.json()) as {
    username?: string
    primaryAccounts?: Record<string, string>
  }
  const accountId = jmap.primaryAccounts?.["urn:ietf:params:jmap:mail"]
  if (!accountId) {
    throw new Error("This Stalwart account does not provide JMAP mail access.")
  }
  return {
    basicAuth: basicAuthCredentials(username, password),
    accountId,
    username: jmap.username || username,
  }
}

/**
 * The `Authorization` header value for the active mail session, supporting
 * both Bearer (oauth, with refresh) and Basic schemes.
 */
export async function activeStalwartAuthorization(): Promise<string> {
  const session = await getSession()
  if (!session?.accessToken && !session?.basicAuth) {
    throw new Error("No active mail session.")
  }
  if (session.authScheme === "Basic" && session.basicAuth) {
    return `Basic ${session.basicAuth}`
  }
  return `Bearer ${await activeStalwartToken()}`
}

export async function activeStalwartToken(): Promise<string> {
  const session = await getSession()
  if (!session?.accessToken) throw new Error("No active mail session.")
  if (!session.accessTokenExpiresAt || session.accessTokenExpiresAt > Date.now()) return session.accessToken
  if (!session.refreshToken) throw new Error("Your mail session expired. Sign in again.")
  // A background send may have rotated the refresh token. Read the locked
  // account vault before attempting to refresh the cookie's older token.
  const queuedCredentials = await currentQueuedCredentials(session)
  if (queuedCredentials) {
    await updateSession({
      accessToken: queuedCredentials.accessToken,
      refreshToken: queuedCredentials.refreshToken,
      accessTokenExpiresAt: queuedCredentials.expiresAt,
    })
    return queuedCredentials.accessToken
  }
  const token = await exchangeToken(new URLSearchParams({ grant_type: "refresh_token", refresh_token: session.refreshToken, client_id: WORKSPACE_CONFIG.oauthClientId }))
  await updateSession({ accessToken: token.access_token!, refreshToken: token.refresh_token ?? session.refreshToken, accessTokenExpiresAt: Date.now() + Math.max(0, (token.expires_in ?? 3600) - 60) * 1000 })
  return token.access_token!
}
