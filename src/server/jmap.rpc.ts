/**
 * JMAP server proxy RPC boundary.
 *
 * Routes JMAP traffic from the browser to Stalwart while keeping the
 * session credential server-side. The transport layer calls these server
 * functions; the browser never sees the access token.
 */

import { createServerFn } from "@tanstack/react-start"
import { getSession, updateSession } from "./session.server"
import { WORKSPACE_CONFIG } from "./config.server"

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
  const session = await getSession()
  if (!session?.accessToken) {
    throw new ProxyError("No active session.", 401)
  }
  return session.accessToken
}

/** Resolve URL templates with placeholders for accountId/blobId. */
function expandTemplate(url: string, vars: Record<string, string>): string {
  return url.replace(/\{([^}]+)\}/g, (_, key: string) => vars[key] ?? "")
}

export const proxyJmapRequest = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { payload: unknown[]; url?: string })
  .handler(async ({ data }) => {
    const token = await requireAccessToken()
    const url = data.url ?? WORKSPACE_CONFIG.jmapPath
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
    const baseUrl =
      data.uploadUrl ??
      `${WORKSPACE_CONFIG.stalwartOrigin}/api/upload/{accountId}`
    const url = expandTemplate(baseUrl, { accountId: data.accountId })
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
    const baseUrl =
      data.downloadUrl ??
      `${WORKSPACE_CONFIG.stalwartOrigin}/api/download/{accountId}/{blobId}`
    const url = expandTemplate(baseUrl, {
      accountId: data.accountId,
      blobId: data.blobId,
    })
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
    if (data.accountId) await updateSession({ accountId: data.accountId })
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
