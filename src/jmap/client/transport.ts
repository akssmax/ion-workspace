/**
 * Transport abstraction for the JMAP client.
 *
 * Two implementations exist:
 *  - `ServerProxyTransport` – routes JMAP traffic through the TanStack Start
 *    server so Stalwart credentials never touch the browser.
 *  - `MockTransport` – dispatches to the in-memory mock JMAP server so the
 *    whole app can run without a Stalwart instance (dev/demo/tests).
 *
 * The client only ever talks to this interface, keeping transport concerns
 * (fetch, batching, headers, credentials) fully isolated from domain code.
 */

export interface UploadMetadata {
  contentType?: string
  filename?: string
}

export interface DownloadRequest {
  accountId: string
  blobId: string
}

export interface EventPushMessage {
  type: string
  args: Record<string, unknown>
  callId?: string
}

export interface EventSubscription {
  close(): void
}

export interface TransportRequestOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

export interface UploadRequestOptions {
  signal?: AbortSignal
}

export interface Transport {
  readonly kind: "real" | "mock"
  /**
   * POST a serialized JMAP request array and receive the parsed response
   * array. The body is fully opaque to the JMAP client layer.
   */
  post(
    payload: unknown[],
    options?: TransportRequestOptions
  ): Promise<unknown[]>
  /**
   * Upload binary content via the JMAP upload endpoint.
   */
  upload(
    accountId: string,
    content: ArrayBuffer,
    metadata?: UploadMetadata,
    options?: UploadRequestOptions
  ): Promise<{ accountId: string; blobId: string; size: number; type: string }>
  /**
   * Download a blob's binary content.
   */
  download(
    request: DownloadRequest,
    options?: TransportRequestOptions
  ): Promise<Blob>
  /**
   * Open a push event stream (SSE/WebSocket). Returns a subscription whose
   * `close()` terminates it. May be undefined when the provider has no push
   * mechanism (mock provider uses polling instead).
   */
  openEventStream?(
    onEvent: (message: EventPushMessage) => void,
    onError: (error: unknown) => void
  ): EventSubscription | null
}
