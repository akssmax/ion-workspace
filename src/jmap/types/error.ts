/**
 * JMAP error types, normalized application errors, and error mapping.
 *
 * Normalization guarantees the UI never has to understand the raw JMAP
 * protocol. Every failure from the transport/client is converted into an
 * `AppError` that carries a stable `code`, a user-facing `message` and a
 * `retryable` flag.
 */

/** Request-level (RFC 8620 §3.6.2) error types. */
export type JmapRequestErrorType =
  | "serverUnavailable"
  | "serverFail"
  | "requestTooLarge"
  | "unknownCapability"
  | "notJson"
  | "notRequest"
  | "unknownMethod"
  | "invalidArguments"

/** Method-level error `type` values for data-type methods. */
export type JmapMethodErrorType =
  | "accountNotFound"
  | "accountNotSupportedByMethod"
  | "accountReadOnly"
  | "cannotCalculateChanges"
  | "invalidArguments"
  | "invalidResultReference"
  | "unknownDataType"
  | "anchorNotFound"
  | "stateMismatch"
  | "serverFail"
  | "serverPartialFail"
  | "serverUnavailable"
  | "forbidden"
  | "requestTooLarge"
  | "unsupportedFilter"
  | "unsupportedSort"
  | "notFound"
  | "unknownMethod"

/** Set-level error `type` values. */
export type JmapSetErrorType =
  | "blobNotFound"
  | "cannotCalculateChanges"
  | "forbidden"
  | "invalidEmail"
  | "invalidProperties"
  | "notFound"
  | "overQuota"
  | "singleton"
  | "tooLarge"
  | "fromMailboxNotFound"
  | "toMailboxNotFound"
  | "invalidPatch"
  | "hasMoreData"
  | "unknownProperty"
  | "unknownMimeType"
  | "invalidMailbox"
  | "invalidRecipients"
  | "noRecipients"
  | "tooManyRecipients"
  | "invalidBlob"
  | "mailboxNotFound"
  | "tooManyKeywords"
  | "archiveFailure"
  | "invalidCalendar"
  | "eventNotFound"
  | "invalidAttendee"
  | "participantNotFound"
  | "duplicateParticipant"

export interface JmapErrorBody {
  type: JmapMethodErrorType
  description?: string
  computedProperties?: string[]
  unsupportedProperties?: string[]
  unsupportedFilters?: string[]
  unsupportedSorts?: string[]
  limit?: number
  max?: number
}

export interface JmapSetErrorRecord {
  type: JmapSetErrorType
  description?: string
  properties?: string[]
}

export interface JmapSetErrors {
  notCreated?: Record<string, JmapSetErrorRecord>
  notUpdated?: Record<string, JmapSetErrorRecord>
  notDestroyed?: Record<string, JmapSetErrorRecord>
}

export type NetworkErrorCode =
  | "NETWORK"
  | "TIMEOUT"
  | "ABORTED"
  | "HTTP"
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "AUTH_REQUIRED"

/**
 * Normalized, application level error.
 */
export class AppError extends Error {
  /** Stable machine readable code used for i18n lookups in the UI. */
  readonly code: string
  /** Set for retryable failures (network, 5xx, serverUnavailable, ...). */
  readonly retryable: boolean
  readonly cancelled: boolean
  readonly details?: Record<string, unknown>

  constructor(
    code: string,
    message: string,
    options?: {
      retryable?: boolean
      cancelled?: boolean
      details?: Record<string, unknown>
      cause?: unknown
    }
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined
    )
    this.name = "AppError"
    this.code = code
    this.retryable = options?.retryable ?? false
    this.cancelled = options?.cancelled ?? false
    this.details = options?.details
  }
}

export class AbortedError extends AppError {
  constructor() {
    super("aborted", "Request was cancelled", { cancelled: true })
    this.name = "AbortedError"
  }
}

const METHOD_ERROR_MESSAGES: Record<string, string> = {
  serverUnavailable:
    "The email server is temporarily unavailable. Please try again.",
  serverFail:
    "The email server could not complete the request. Please try again.",
  serverPartialFail: "Only part of the request succeeded. Please retry.",
  accountNotFound: "The account could not be found.",
  accountReadOnly: "This account is read-only.",
  accountUnsupportedByMethod:
    "This account does not support the requested operation.",
  invalidArguments: "The request contained invalid arguments.",
  forbidden: "You do not have permission to perform this action.",
  insufficientPrivileges: "You do not have permission to perform this action.",
  stateMismatch:
    "The data changed while you were working. Please refresh and retry.",
  notFound: "The requested item no longer exists.",
  cannotCalculateChanges: "The data changed too much; please refresh.",
  overQuota: "Your storage quota is full.",
  notSubscribed: "You are not subscribed to this mailbox.",
  unsupportedFilter: "This search filter is not supported.",
  anonymousReadNotAllowed: "Anonymous access is not allowed.",
}

const SET_ERROR_MESSAGES: Record<string, string> = {
  overQuota: "Your storage quota is full.",
  tooLarge: "The item is too large.",
  tooManyRecipients: "This email has too many recipients.",
  noRecipients: "This email has no recipients.",
  invalidRecipients: "One or more recipients are invalid.",
  invalidBlob: "The attachment was not uploaded correctly.",
  blobNotFound: "The attachment was not uploaded.",
  mailboxNotFound: "The mailbox could not be found.",
  invalidMailbox: "The destination mailbox is invalid.",
  forbidden: "You do not have permission to perform this action.",
  notFound: "The requested item no longer exists.",
}

/** Codes whose meaning indicates the server hit a transient failure. */
const RETRYABLE_CODES = new Set([
  "serverUnavailable",
  "serverPartialFail",
  "NETWORK",
  "TIMEOUT",
  "HTTP_502",
  "HTTP_503",
  "HTTP_504",
])

export function isRetryableCode(code: string): boolean {
  return RETRYABLE_CODES.has(code)
}

export function formatMethodError(error: JmapErrorBody): string {
  return (
    error.description ??
    METHOD_ERROR_MESSAGES[error.type] ??
    "The server could not complete this operation."
  )
}

export function formatSetError(
  type: JmapSetErrorType,
  description?: string
): string {
  return (
    description ??
    SET_ERROR_MESSAGES[type] ??
    "The operation could not be completed."
  )
}

/**
 * Map a raw JMAP method-level error body to an `AppError`.
 */
export function methodErrorToAppError(error: JmapErrorBody): AppError {
  const retryable = isRetryableCode(error.type)
  return new AppError(error.type, formatMethodError(error), {
    retryable,
    details: error as unknown as Record<string, unknown>,
  })
}

/**
 * Map any unknown thrown value to an `AppError`. Preserves already
 * normalized errors.
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (error instanceof DOMException && error.name === "AbortError")
    return new AbortedError()
  if (error instanceof Error && error.name === "AbortError")
    return new AbortedError()

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Something went wrong."

  const code = isNetworkFailure(error) ? "NETWORK" : "UNKNOWN"
  return new AppError(code, message, {
    retryable: isNetworkFailure(error),
    cause: error,
  })
}

function isNetworkFailure(error: unknown): boolean {
  if (error instanceof TypeError && "cause" in error) return true
  if (error instanceof Error) {
    return /failed to fetch|network|load failed|ECONNREFUSED|ENOTFOUND/i.test(
      error.message
    )
  }
  return false
}

/**
 * Extract the first set error for an id, falling back to a generic error.
 */
export function setErrorsToAppError(
  errors: JmapSetErrors | undefined,
  id: string,
  fallback: string
): AppError {
  const record =
    errors?.notCreated?.[id] ??
    errors?.notUpdated?.[id] ??
    errors?.notDestroyed?.[id]
  if (record) {
    return new AppError(
      record.type,
      formatSetError(record.type, record.description),
      {
        retryable: false,
        details: { properties: record.properties },
      }
    )
  }
  return new AppError("unknown", fallback, { retryable: true })
}
