/**
 * JMAP Core types (RFC 8620): session, capabilities, accounts, and the
 * method call wire format.
 */

export const JMAP_CAPS = {
  CORE: "urn:ietf:params:jmap:core",
  MAIL: "urn:ietf:params:jmap:mail",
  CALENDARS: "urn:ietf:params:jmap:calendars",
  CONTACTS: "urn:ietf:params:jmap:contacts",
  FILES: "urn:ietf:params:jmap:filenode",
  SUBMISSION: "urn:ietf:params:jmap:submission",
} as const

export interface JmapAccountCapabilities {
  [capability: string]: unknown
  mail?: {
    maxMailboxesPerEmail?: number
    maxSizeAttachmentsPerEmail?: number
    mayCreateTopLevelMailbox?: boolean
    emailQuerySortOptions?: string[]
  }
  calendars?: {
    maxEventsPerEmail?: number
    maxRecurrenceRulesPerEmail?: number
    mayCreateTopLevelCalendars?: boolean
  }
  contacts?: { mayCreateTopLevelAddressBooks?: boolean }
  files?: { maxDepth?: number; allowedContentTypes?: string[] }
}

export interface JmapAccount {
  id: string
  name: string
  isPersonal: boolean
  isReadOnly: boolean
  accountCapabilities: JmapAccountCapabilities
}

export interface JmapCoreCapabilities {
  maxSizeUpload: number
  maxConcurrentUpload: number
  maxSizeRequest: number
  maxCallsInRequest: number
  maxObjectsInGet: number
  maxObjectsInSet: number
  collationAlgorithms?: string[]
}

export interface JmapSession {
  capabilities: Record<string, JmapCoreCapabilities | Record<string, unknown>>
  accounts: Record<string, JmapAccount>
  primaryAccounts: Record<string, string>
  username: string
  apiUrl: string
  eventSourceUrl: string
  uploadUrl: string
  downloadUrl: string
  /** State of the session; changes when capabilities/data change. */
  state?: string
}

/**
 * Logically represents one JMAP method invocation embedded in a Request.
 * Safe to be part of a batch.
 */
export interface JmapCall {
  /** Stable (unique within a request) id used to match responses. */
  id: string
  method: string
  args?: Record<string, unknown>
  /** chain the state updates to another call in the same request */
  onSuccess?: string | null
  onError?: string | null
  /** Result reference so an earlier result feeds this call's "live" args. */
  resultOf?: {
    callId: string
    name: string
    path?: string
    /** true: destroy after, i.e. reference is consumed */
  } | null
}

/** Outline produced by client for a disabled reference */
export interface JmapCallRecord {
  call: JmapCall
  disabledReason?: string
}

export interface UploadedBlob {
  accountId: string
  blobId: string
  size: number
  type: string
  name?: string
  fileName?: string
}

export interface JmapChangesResponse<T> {
  accountId: string
  oldState?: string
  newState: string
  created: T[] | [string, T][]
  updated: T[] | [string, T][]
  destroyed: string[]
  hasMoreChanges: boolean
  changedProperties?: string[]
}

export interface JmapQueryChangesResponse {
  accountId: string
  oldState?: string
  newState: string
  created: string[]
  updated: string[]
  destroyed: string[]
  changedProperties?: Record<string, string[]>
}
