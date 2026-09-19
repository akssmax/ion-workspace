/**
 * Mock transport: dispatches JMAP traffic to the in-memory mock server so
 * the full app runs without a Stalwart instance.
 */

import type {
  DownloadRequest,
  EventPushMessage,
  EventSubscription,
  Transport,
} from "../client/transport"
import { MockServer } from "./mock/MockServer"

export class MockTransport implements Transport {
  readonly kind = "mock" as const

  private readonly server = new MockServer()
  private liveSubscriptions = 0

  constructor() {}

  async post(payload: unknown[]): Promise<unknown[]> {
    return this.server.handle(payload)
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
    const blobId = `blob_up_${Math.random().toString(36).slice(2, 10)}`
    const text = new TextDecoder().decode(content)
    const size = content.byteLength
    const type = metadata.contentType ?? "application/octet-stream"
    this.server.addBlob({
      blobId,
      name: metadata.filename ?? "file",
      type,
      size,
      content: text.length ? text : `mock-file:${blobId}`,
    })
    return { accountId, blobId, size, type }
  }

  async download(request: DownloadRequest): Promise<Blob> {
    const blob = this.server.getBlob(request.blobId)
    if (!blob) {
      throw new Error(`Mock blob "${request.blobId}" not found.`)
    }
    return new Blob([blob.content], { type: blob.type })
  }

  openEventStream(
    onEvent: (message: EventPushMessage) => void,
    onError: (error: unknown) => void
  ): EventSubscription {
    const unsubscribe = this.server.emitter.on((event) => {
      try {
        onEvent({ type: event.type, args: event.args, callId: event.callId })
      } catch (error) {
        onError(error)
      }
    })
    this.liveSubscriptions += 1
    const self = this

    // Heartbeat so subscribers can fail fast.
    const heartbeat = setInterval(() => {
      // the mock server never disconnects; no-op heartbeat to keep timers sane
    }, 25_000)

    return {
      close() {
        unsubscribe()
        clearInterval(heartbeat)
        self.liveSubscriptions -= 1
      },
    }
  }
}

export function isMockTransport(
  transport: Transport
): transport is MockTransport {
  return transport instanceof MockTransport
}
