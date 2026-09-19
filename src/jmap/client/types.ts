/**
 * Wire-level JMAP method call shape. A call is a single method invocation
 * within a JMAP Request; multiple calls batch into one request.
 */

export interface JmapCall {
  /** Unique within a request; responses are keyed by this. */
  id: string
  method: string
  args?: Record<string, unknown>
  onSuccess?: string | null
  onError?: string | null
  /**
   * Result reference: resolve `#<callId>` placeholders in `args` from an
   * earlier call's response (RFC 8620 §8.1).
   */
  resultOf?: {
    callId: string
    name: string
    path?: string
  } | null
}

export interface JmapResultReference {
  callId: string
  name: string
  path?: string
}
