import { createHash, randomBytes } from "node:crypto"
import { WORKSPACE_CONFIG } from "./config.server"
import { getSession, updateSession } from "./session.server"

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

export async function activeStalwartToken(): Promise<string> {
  const session = await getSession()
  if (!session?.accessToken) throw new Error("No active mail session.")
  if (!session.accessTokenExpiresAt || session.accessTokenExpiresAt > Date.now()) return session.accessToken
  if (!session.refreshToken) throw new Error("Your mail session expired. Sign in again.")
  const token = await exchangeToken(new URLSearchParams({ grant_type: "refresh_token", refresh_token: session.refreshToken, client_id: WORKSPACE_CONFIG.oauthClientId }))
  await updateSession({ accessToken: token.access_token!, refreshToken: token.refresh_token ?? session.refreshToken, accessTokenExpiresAt: Date.now() + Math.max(0, (token.expires_in ?? 3600) - 60) * 1000 })
  return token.access_token!
}
