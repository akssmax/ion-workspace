/**
 * JMAP server proxy RPC boundary.
 *
 * Routes JMAP traffic from the browser to Stalwart while keeping the
 * session credential server-side. The transport layer calls these server
 * functions; the browser never sees the access token.
 */

import { createServerFn } from "@tanstack/react-start"
import { updateSession } from "./session.server"
import { WORKSPACE_CONFIG } from "./config.server"
import { activeStalwartToken } from "./stalwart-auth.server"

class ProxyError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly retryable = false
  ) {
    super(message)
  }
}

async function requireAccessToken(): Promise<string> {
  try { return await activeStalwartToken() }
  catch { throw new ProxyError("Your mail session expired. Sign in again.", 401) }
}

/** Resolve URL templates with placeholders for accountId/blobId. */
function expandTemplate(url: string, vars: Record<string, string>): string {
  return url.replace(/\{([^}]+)\}/g, (_, key: string) =>
    encodeURIComponent(vars[key] ?? "")
  )
}

/** Never fetch a client-chosen host with the server's Stalwart credentials. */
function trustedEndpoint(
  candidate: string | undefined,
  fallback: string,
  path: string
): string {
  const url = new URL(candidate ?? fallback)
  const origin = new URL(WORKSPACE_CONFIG.stalwartOrigin)
  const allowedPath = path.endsWith("/")
    ? url.pathname.startsWith(path)
    : url.pathname === path || url.pathname.startsWith(`${path}/`)
  if (
    url.origin !== origin.origin ||
    !allowedPath ||
    url.username ||
    url.password
  ) {
    throw new ProxyError("Invalid mail server endpoint.", 400)
  }
  return url.toString()
}

export const proxyJmapRequest = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { payload: unknown; url?: string })
  .handler(async ({ data }) => {
    const token = await requireAccessToken()
    const url = trustedEndpoint(data.url, WORKSPACE_CONFIG.jmapPath, "/jmap")
    let response: Response
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data.payload),
        signal: AbortSignal.timeout(30_000),
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Proxy request failed"
      throw new ProxyError(message, undefined, true)
    }

    if (!response.ok) {
      if (response.status === 401)
        throw new ProxyError("Session expired, please log in again.", 401)
      if (response.status >= 500)
        throw new ProxyError(
          "The mail server reported a problem.",
          response.status,
          true
        )
      throw new ProxyError(
        `The mail server rejected the request (${response.status}).`,
        response.status
      )
    }

    return (await response.json()) as any
  })

export const proxySession = createServerFn({ method: "GET" }).handler(
  async () => {
    const token = await requireAccessToken()
    const origin = WORKSPACE_CONFIG.stalwartOrigin
    const sessionUrl = `${origin}/.well-known/jmap`
    let response: Response
    try {
      response = await fetch(sessionUrl, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15_000),
      })
    } catch {
      throw new ProxyError(
        "Could not reach the mail server session endpoint.",
        undefined,
        true
      )
    }
    if (!response.ok)
      throw new ProxyError(
        "Could not load the mail server session.",
        response.status
      )
    return (await response.json()) as any
  }
)

export const proxyUpload = createServerFn({ method: "POST" })
  .validator(
    (input: unknown) =>
      input as {
        accountId: string
        content: string // base64
        contentType?: string
        filename?: string
        uploadUrl?: string
      }
  )
  .handler(async ({ data }) => {
    const token = await requireAccessToken()
    const baseUrl = trustedEndpoint(
      data.uploadUrl,
      `${WORKSPACE_CONFIG.stalwartOrigin}/jmap/upload/{accountId}/`,
      "/jmap/upload/"
    )
    const url = trustedEndpoint(
      expandTemplate(baseUrl, { accountId: data.accountId }),
      baseUrl,
      "/jmap/upload/"
    )
    const bytes = Uint8Array.from(atob(data.content), (c) => c.charCodeAt(0))

    const headers: Record<string, string> = {
      "Content-Type": data.contentType ?? "application/octet-stream",
      Authorization: `Bearer ${token}`,
    }
    if (data.filename) {
      headers["Content-Disposition"] =
        `attachment; filename="${encodeURIComponent(data.filename)}"`
    }

    let response: Response
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body: bytes,
        signal: AbortSignal.timeout(60_000),
      })
    } catch {
      throw new ProxyError("Upload failed.", undefined, true)
    }
    if (!response.ok) {
      if (response.status === 413)
        throw new ProxyError("The file is too large to upload.")
      throw new ProxyError(
        `Upload failed (${response.status}).`,
        response.status
      )
    }
    const body = (await response.json()) as {
      accountId?: string
      blobId: string
      size: number
      type: string
    }
    if (!body.blobId) throw new ProxyError("Upload returned no blob id.")
    return body
  })

export const proxyDownload = createServerFn({ method: "POST" })
  .validator(
    (input: unknown) =>
      input as { accountId: string; blobId: string; downloadUrl?: string }
  )
  .handler(async ({ data }) => {
    const token = await requireAccessToken()
    const baseUrl = trustedEndpoint(
      data.downloadUrl,
      `${WORKSPACE_CONFIG.stalwartOrigin}/jmap/download/{accountId}/{blobId}/download`,
      "/jmap/download/"
    )
    const url = trustedEndpoint(
      expandTemplate(baseUrl, {
        accountId: data.accountId,
        blobId: data.blobId,
        name: "download",
        type: "*/*",
      }),
      baseUrl,
      "/jmap/download/"
    )
    let response: Response
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(60_000),
      })
    } catch {
      throw new ProxyError("Download failed.", undefined, true)
    }
    if (!response.ok)
      throw new ProxyError(
        `Download failed (${response.status}).`,
        response.status
      )
    const buffer = await response.arrayBuffer()
    const contentType =
      response.headers.get("content-type") ?? "application/octet-stream"
    return {
      base64: toBase64(buffer),
      contentType,
    }
  })

/** Record the primary account id once the Jam session is known. */
export const persistAccountId = createServerFn({ method: "POST" })
  .validator(
    (input: unknown) => input as { accountId?: string; username?: string }
  )
  .handler(async ({ data }) => {
    if (data.accountId) {
      const token = await requireAccessToken()
      const response = await fetch(`${WORKSPACE_CONFIG.stalwartOrigin}/.well-known/jmap`, {
        headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000),
      })
      if (!response.ok) throw new ProxyError("Could not verify mail account.", response.status)
      const session = await response.json() as { accounts?: Record<string, { accountCapabilities?: Record<string, unknown> }> }
      if (!session.accounts?.[data.accountId]?.accountCapabilities?.["urn:ietf:params:jmap:mail"]) throw new ProxyError("Mail account is unavailable.", 403)
      await updateSession({ accountId: data.accountId })
    }
    return { ok: true }
  })

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}
