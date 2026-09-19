/**
 * Real transport: routes JMAP through the TanStack Start server proxy so
 * Stalwart credentials stay server-side. The browser only ever talks to
 * our own server functions.
 */

import {
  proxyDownload,
  proxyJmapRequest,
  proxySession,
  proxyUpload,
} from "../../server/jmap.rpc"
import type {
  DownloadRequest,
  EventPushMessage,
  EventSubscription,
  Transport,
  TransportRequestOptions,
} from "../client/transport"
import type { JmapSession } from "../types"
import { JMAP_CAPS } from "../types"

export interface ServerProxyTransportOptions {
  /** Public same-origin SSE URL for JMAP push (optional; falls back to polling). */
  publicEventSourceUrl?: string | null
}

export class ServerProxyTransport implements Transport {
  readonly kind = "real" as const

  private sessionCache: JmapSession | null = null
  private sessionPromise: Promise<JmapSession> | null = null

  constructor(private readonly options: ServerProxyTransportOptions = {}) {}

  async post(
    payload: unknown[],
    _options?: TransportRequestOptions
  ): Promise<unknown[]> {
    const session = await this.getSession()
    const isSessionCall = payload.some(
      (inv) =>
        Array.isArray(inv) && (inv[0] as string | undefined) === "Core/session"
    )
    if (isSessionCall) {
      return [["Core/session", session, "c0"]]
    }
    const postRequest = proxyJmapRequest as unknown as (input: {
      data: { payload: unknown[]; url: string }
    }) => Promise<unknown[]>
    return postRequest({ data: { payload, url: session.apiUrl } })
  }

  async upload(
    accountId: string,
    content: ArrayBuffer,
    metadata: { contentType?: string; filename?: string } = {}
  ): Promise<{
    accountId: string
    blobId: string
    size: number
    type: string
  }> {
    const session = await this.getSession()
    const upload = proxyUpload as unknown as (input: {
      data: {
        accountId: string
        content: string
        contentType?: string
        filename?: string
        uploadUrl?: string
      }
    }) => Promise<{ blobId: string; size: number; type: string }>
    const result = await upload({
      data: {
        accountId,
        content: toBase64(content),
        contentType: metadata.contentType ?? "application/octet-stream",
        filename: metadata.filename,
        uploadUrl: session.uploadUrl,
      },
    })
    return {
      accountId,
      blobId: result.blobId,
      size: result.size,
      type: result.type,
    }
  }

  async download(
    request: DownloadRequest,
    _options?: TransportRequestOptions
  ): Promise<Blob> {
    const session = await this.getSession()
    const download = proxyDownload as unknown as (input: {
      data: { accountId: string; blobId: string; downloadUrl?: string }
    }) => Promise<{ base64: string; contentType: string }>
    const result = await download({
      data: {
        accountId: request.accountId,
        blobId: request.blobId,
        downloadUrl: session.downloadUrl,
      },
    })
    const bytes = decodeBase64(result.base64)
    return new Blob([bytes.buffer as unknown as ArrayBuffer], {
      type: result.contentType,
    })
  }

  /**
   * Server push via the publicly reachable SSE URL (same-origin proxied by
   * Stalwart or an edge). When not configured this returns null and the sync
   * engine falls back to polling.
   */
  openEventStream(
    onEvent: (message: EventPushMessage) => void,
    onError: (error: unknown) => void
  ): EventSubscription | null {
    const url = this.options.publicEventSourceUrl ?? getPublicEventSourceUrl()
    if (!url) return null
    const source = new EventSource(url)
    source.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data) as {
          "@type"?: string
          type?: string
          [k: string]: unknown
        }
        onEvent({
          type: parsed["@type"] ?? parsed.type ?? "StateChange",
          args: parsed,
        })
      } catch {
        onError(e)
      }
    }
    source.onerror = (e) => onError(e)
    return {
      close: () => source.close(),
    }
  }

  private getSession(): Promise<JmapSession> {
    if (this.sessionCache) return Promise.resolve(this.sessionCache)
    if (!this.sessionPromise) {
      this.sessionPromise = proxySession().then((doc) => {
        const session = (doc as Record<string, unknown> | null) ?? {}
        const typed = session as unknown as JmapSession
        // discover the mail account id and store it for future binds
        typed.primaryAccounts ??= {}
        if (!typed.primaryAccounts[JMAP_CAPS.MAIL]) {
          const first = Object.keys(typed.accounts ?? {})[0]
          if (first) typed.primaryAccounts[JMAP_CAPS.MAIL] = first
        }
        this.sessionCache = typed
        return typed
      })
    }
    return this.sessionPromise
  }

  async resolveAccountId(): Promise<string | null> {
    const session = await this.getSession()
    const mailAccount =
      session.primaryAccounts?.[JMAP_CAPS.MAIL] ??
      session.primaryAccounts?.[JMAP_CAPS.CORE]
    return mailAccount ?? null
  }
}

function getPublicEventSourceUrl(): string | null {
  try {
    // An isomorphic-safe way to read the public URL without leaking any
    // server env into the client bundle for the mock path.
    const url = (globalThis as { __JMAP_PUBLIC_ES_URL__?: string })
      .__JMAP_PUBLIC_ES_URL__
    return url ?? null
  } catch {
    return null
  }
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function decodeBase64(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
