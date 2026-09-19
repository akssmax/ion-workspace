/**
 * The reusable JMAP client (RFC 8620 / 8621 / 8984 / 9739 + files draft).
 *
 * Responsibilities (from the architecture rules):
 *  - JMAP session discovery and capability exposure
 *  - request batching (multiple invocations per HTTP round trip)
 *  - request references (`resultOf`) support
 *  - error normalization (transport + method level)
 *  - retries for retryable failures
 *  - request cancellation (AbortSignal)
 *  - response typing
 *  - upload / download / push event helpers
 *
 * The client is transport agnostic and does not know whether it is talking
 * to Stalwart (through the server proxy) or to the in-memory mock server.
 */

import { JMAP_CAPS } from "../types"
import type { JmapSession, UploadedBlob } from "../types"
import {
  AppError,
  AbortedError,
  methodErrorToAppError,
  setErrorsToAppError,
  toAppError,
  type JmapErrorBody,
  type JmapSetErrors,
} from "../types/error"
import type { Transport } from "./transport"
import { MailApi } from "./MailApi"
import { CalendarApi } from "./CalendarApi"
import { ContactsApi } from "./ContactsApi"
import { FilesApi } from "./FilesApi"
import type { JmapCall } from "./types"

export interface JmapClientOptions {
  maxCallsInRequest?: number
  maxSizeRequest?: number
  retries?: number
  retryDelayMs?: number
  defaultTimeoutMs?: number
  using?: string[]
}

export type JmapRetryOpts = {
  /** max number of extra attempts */
  retries?: number
}

export interface InvokeOptions {
  signal?: AbortSignal
  timeoutMs?: number
  /** disable auto retry for this call batch */
  noRetry?: boolean
  /** fine-grained retry control */
  retry?: JmapRetryOpts
  /** the account this request targets (used for error context) */
  accountId?: string
}

interface ParsedInvocation {
  callId: string
  method: string
  args: Record<string, unknown>
  isError: boolean
}

export interface JmapBatchResponse {
  /** Map over all parsed invocations in server order. */
  getAll(): ParsedInvocation[]
  /** Convenience list in server order filtered to successes */
  getSuccesses(): ParsedInvocation[]
  /** true when every call succeeded */
  allOk: boolean
  /** true when at least one call was an error */
  anyError: boolean
  /**
   * Read the typed response args for a call id. Throws an `AppError` when
   * the call produced a method error.
   */
  get<T>(callId: string): T
  /**
   * Same as get but for response args of unknown shape.
   */
  getArgs(callId: string): Record<string, unknown>
  /**
   * Extract a call-id → created Id map from a set response.
   */
  createdIds(callId: string): Record<string, string>
}

const isIdempotentMethod = (method: string): boolean =>
  /\/get$|\/query$|\/changes$|\/queryChanges$|\/getUpdates$/.test(method)

export const coreUsing = [
  JMAP_CAPS.CORE,
  JMAP_CAPS.MAIL,
  JMAP_CAPS.SUBMISSION,
  JMAP_CAPS.CALENDARS,
  JMAP_CAPS.CONTACTS,
  JMAP_CAPS.FILES,
]

export class JmapClient {
  readonly mail: MailApi
  readonly calendar: CalendarApi
  readonly contacts: ContactsApi
  readonly files: FilesApi

  readonly transport: Transport
  private readonly opts: Required<
    Pick<
      JmapClientOptions,
      | "maxCallsInRequest"
      | "maxSizeRequest"
      | "retries"
      | "retryDelayMs"
      | "defaultTimeoutMs"
    >
  > &
    JmapClientOptions

  private sessionPromise: Promise<JmapSession> | null = null
  private sessionData: JmapSession | null = null

  constructor(transport: Transport, options: JmapClientOptions = {}) {
    this.transport = transport
    this.opts = {
      maxCallsInRequest: options.maxCallsInRequest ?? 100,
      maxSizeRequest: options.maxSizeRequest ?? 5_000_000,
      retries: options.retries ?? 2,
      retryDelayMs: options.retryDelayMs ?? 300,
      defaultTimeoutMs: options.defaultTimeoutMs ?? 30_000,
      ...options,
    }

    this.mail = new MailApi(this)
    this.calendar = new CalendarApi(this)
    this.contacts = new ContactsApi(this)
    this.files = new FilesApi(this)
  }

  get isMock(): boolean {
    return this.transport.kind === "mock"
  }

  /**
   * Discover (and cache) the JMAP session document.
   */
  async session(force = false): Promise<JmapSession> {
    if (force || !this.sessionPromise) {
      this.sessionPromise = this.discoverSession()
    }
    return this.sessionPromise
  }

  private async discoverSession(): Promise<JmapSession> {
    try {
      const result = await this.transport.post(
        [
          [
            "Core/session",
            {},
            "c0",
            { resultOf: { callId: "c0", name: "Core/session", path: "/" } },
          ],
        ],
        { timeoutMs: this.opts.defaultTimeoutMs }
      )
      const invocation = Array.isArray(result) ? result[0] : null
      if (
        !invocation ||
        !Array.isArray(invocation) ||
        invocation[0] !== "Core/session"
      ) {
        throw new AppError(
          "invalidSession",
          "The server returned an invalid session.",
          {
            retryable: true,
          }
        )
      }
      const args = invocation[1] as unknown as JmapSession
      this.sessionData = args
      this.capabilityMaxCalls = (
        args.capabilities?.[JMAP_CAPS.CORE] as { maxCallsInRequest?: number }
      )?.maxCallsInRequest
      return args
    } catch (error) {
      throw toAppError(error)
    }
  }

  private capabilityMaxCalls: number | undefined

  /** session state id if present in the session document. */
  get sessionState(): string | undefined {
    return this.sessionData?.state
  }

  /**
   * Send one or more method calls as a single JMAP request.
   * Returns a typed, call-id keyed response. Throws on transport failure
   * (with retries for retryable failures) or whenever the entire request
   * is rejected.
   */
  async invoke(
    calls: JmapCall | JmapCall[],
    options: InvokeOptions = {}
  ): Promise<JmapBatchResponse> {
    const list = Array.isArray(calls) ? calls : [calls]
    if (list.length === 0)
      throw new AppError("invalidArguments", "No method calls supplied.")
    this.throwIfAborted(options.signal)

    const body = this.buildRequestBody(list)
    const retries = options.noRetry
      ? 0
      : (options.retry?.retries ??
        (allIdempotent(list) ? this.opts.retries : 0))

    let attempt = 0
    for (;;) {
      this.throwIfAborted(options.signal)
      try {
        const raw = await this.transport.post(body, {
          signal: options.signal,
          timeoutMs: options.timeoutMs ?? this.opts.defaultTimeoutMs,
        })
        return this.parseResponse(raw, list)
      } catch (error) {
        const normalized = toAppError(error)
        if (normalized.cancelled) throw normalized
        if (attempt < retries && normalized.retryable) {
          attempt += 1
          await sleep(jitter(this.opts.retryDelayMs) * attempt)
          continue
        }
        throw normalized
      }
    }
  }

  /**
   * Convenience for a single call where the caller wants the typed success
   * args directly (throws on failure).
   */
  async call<T>(
    method: string,
    args: Record<string, unknown> | object,
    callId?: string,
    options: InvokeOptions = {}
  ): Promise<T> {
    const id = callId ?? "r0"
    const result = await this.invoke(
      [{ method, args: args as Record<string, unknown>, id }],
      options
    )
    return result.get<T>(id)
  }

  /**
   * Upload a blob, returns `{ blobId, size, type }`.
   */
  async upload(
    accountId: string,
    content: ArrayBuffer,
    metadata: { contentType?: string; filename?: string } = {},
    options: { signal?: AbortSignal } = {}
  ): Promise<UploadedBlob> {
    const result = await this.transport.upload(
      accountId,
      content,
      metadata,
      options
    )
    return {
      accountId,
      blobId: result.blobId,
      size: result.size,
      type: result.type,
    }
  }

  /**
   * Download the binary of a blob.
   */
  async download(
    accountId: string,
    blobId: string,
    options: { signal?: AbortSignal } = {}
  ): Promise<Blob> {
    return this.transport.download({ accountId, blobId }, options)
  }

  /**
   * Subscribe to JMAP push events. Returns the live subscription (already
   * started) or null when push is unavailable.
   */
  startPush(
    onEvent: (payload: Record<string, unknown>) => void,
    onError?: (error: unknown) => void
  ): { close(): void } | null {
    if (!this.transport.openEventStream) return null
    return this.transport.openEventStream(
      // Preserve the event type so subscribers can route by entity.
      (message) =>
        onEvent({ type: message.type, ...(message.args ?? {}) }),
      (error) => onError?.(error)
    )
  }

  /** True when the transport supports server push. */
  get hasPush(): boolean {
    return this.transport.openEventStream != null
  }

  // -- internals ---------------------------------------------------------

  private buildRequestBody(calls: JmapCall[]): unknown[] {
    // Guard against requesting more calls than the server allows.
    const capabilityLimit =
      this.capabilityMaxCalls ?? this.opts.maxCallsInRequest
    if (calls.length > capabilityLimit) {
      throw new AppError(
        "requestTooLarge",
        "Too many calls in one JMAP request.",
        { retryable: false }
      )
    }

    const using = dedupe([...(this.opts.using ?? []), ...coreUsing])

    // All calls are scoped under a single capability invocation.
    const serialized: unknown[] = [[JMAP_CAPS.CORE, { using }, "d0"]]
    for (const call of calls) {
      const options: Record<string, unknown> = {}
      if (call.resultOf) {
        options.resultOf = {
          callId: call.resultOf.callId,
          name: call.resultOf.name,
          ...(call.resultOf.path ? { path: call.resultOf.path } : {}),
        }
      }
      if (call.onSuccess) options.onSuccess = call.onSuccess
      if (call.onError) options.onError = call.onError
      const invocation: unknown[] = [call.method, call.args ?? {}, call.id]
      if (Object.keys(options).length > 0) invocation.push(options)
      serialized.push(invocation)
    }

    const approximate = !this.opts.maxSizeRequest
    if (approximate) return serialized
    const size = byteLengthOf(serialized)
    if (size > this.opts.maxSizeRequest) {
      throw new AppError(
        "requestTooLarge",
        "Serialized JMAP request exceeds the maximum size.",
        {
          retryable: false,
          details: { size, max: this.opts.maxSizeRequest },
        }
      )
    }
    return serialized
  }

  private parseResponse(raw: unknown[], calls: JmapCall[]): JmapBatchResponse {
    if (!Array.isArray(raw)) {
      throw new AppError(
        "invalidResponse",
        "The JMAP server returned an unparsable response.",
        {
          retryable: true,
        }
      )
    }

    // The first element is the capability invocation; skip it.
    const invocations: ParsedInvocation[] = []
    for (const entry of raw.slice(1)) {
      if (!Array.isArray(entry) || entry.length < 3) continue
      const [method, args, callId] = entry as [
        string,
        Record<string, unknown>,
        string,
      ]
      const isError =
        method === "error" ||
        (Array.isArray(entry) &&
          entry.length >= 4 &&
          typeof entry[3] === "object" &&
          (entry[3] as { DS?: string }).DS === "0")
      invocations.push({
        callId,
        method: isError && method === "error" ? callId : method,
        args: args as Record<string, unknown>,
        isError: isError || args?.type === "serverUnavailable",
      })
    }

    // Validate that every expected call id got a response.
    const responded = new Set(invocations.map((i) => i.callId))
    for (const call of calls) {
      if (!responded.has(call.id)) {
        throw new AppError(
          "invalidResponse",
          `No response for method call "${call.id}".`,
          {
            retryable: true,
          }
        )
      }
    }

    return new BatchResponse(invocations)
  }

  private throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) throw new AbortedError()
  }
}

// -- BatchResponse implementation -----------------------------------------

class BatchResponse implements JmapBatchResponse {
  readonly calls: JmapCall[]
  private readonly entries: ParsedInvocation[]

  constructor(entries: ParsedInvocation[]) {
    this.entries = entries
    this.calls = []
  }

  getAll(): ParsedInvocation[] {
    return this.entries
  }

  getSuccesses(): ParsedInvocation[] {
    return this.entries.filter((e) => !e.isError)
  }

  get allOk(): boolean {
    return this.entries.every((e) => !e.isError)
  }

  get anyError(): boolean {
    return this.entries.some((e) => e.isError)
  }

  getArgs(callId: string): Record<string, unknown> {
    const found = this.entries.filter((e) => e.callId === callId)
    if (found.length === 0) {
      throw new AppError(
        "methodNotFound",
        `No response received for call "${callId}".`,
        { retryable: true }
      )
    }
    const error = found.find((e) => e.isError)
    if (error) {
      const body = error.args as unknown as JmapErrorBody
      throw methodErrorToAppError(body)
    }
    return found[0].args
  }

  get<T>(callId: string): T {
    return this.getArgs(callId) as T
  }

  createdIds(callId: string): Record<string, string> {
    // Only used for Email/set style calls where the response maps
    // client-supplied ids to server-created ids.
    const args = this.getArgs(callId) as {
      created?: Record<string, { id?: string }>
    }
    const map: Record<string, string> = {}
    for (const [clientId, value] of Object.entries(args.created ?? {})) {
      if (value.id) map[clientId] = value.id
    }
    return map
  }
}

/** Extract a client-form or update-created server id mapping helper. */
export function firstError(
  response: JmapBatchResponse,
  callId: string
): AppError | null {
  const args = response.getAll().find((e) => e.callId === callId && e.isError)
  if (!args) return null
  return methodErrorToAppError(args.args as unknown as JmapErrorBody)
}

export function throwIfSetError(
  response: JmapBatchResponse,
  callId: string,
  createdIds: Record<string, string>
): void {
  const args = response.get(callId) as {
    notCreated?: JmapSetErrors
    notUpdated?: JmapSetErrors
    notDestroyed?: JmapSetErrors
  }
  for (const [clientId] of Object.entries(args.notCreated ?? {})) {
    throw setErrorsToAppError(
      args.notCreated,
      clientId,
      "Some emails could not be created."
    )
  }
  for (const [serverId] of Object.entries(args.notUpdated ?? {})) {
    throw setErrorsToAppError(
      args.notUpdated,
      serverId,
      "Some emails could not be updated."
    )
  }
  for (const [serverId] of Object.entries(args.notDestroyed ?? {})) {
    throw setErrorsToAppError(
      args.notDestroyed,
      serverId,
      "Some emails could not be deleted."
    )
  }
  void createdIds
}

// -- helpers --------------------------------------------------------------

function dedupe(values: string[]): string[] {
  return [...new Set(values)]
}

function allIdempotent(calls: JmapCall[]): boolean {
  return calls.every((c) => isIdempotentMethod(c.method))
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function jitter(baseMs: number): number {
  return Math.round(baseMs * (0.5 + Math.random() * 0.5))
}

function byteLengthOf(value: unknown): number {
  const json = JSON.stringify(value)
  return json == null ? 0 : new TextEncoder().encode(json).length
}
