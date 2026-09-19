/**
 * JMAP Mail data types and method args (RFC 8621), as plain JSON-safe
 * interfaces. Kept free of any transport concerns so the mock provider and
 * the real client share identical shapes.
 */

export type JmapId = string
export type JmapDate = string // "YYYY-MM-DDTHH:mm:ss.sssZ"
export type JmapUtcDate = string // millisecond epoch encoded as string

export type MailboxRole =
  | "all"
  | "archive"
  | "drafts"
  | "flagged"
  | "important"
  | "inbox"
  | "junk"
  | "sent"
  | "subscribed"
  | "trash"

export type Keyword = string

export interface Address {
  name?: string
  email: string
}

export interface EmailAddress {
  name?: string
  email: string
  eescaped?: string
}

export interface EmailBodyPart {
  partId?: string | null
  blobId?: string | null
  size?: number
  name?: string | null
  type?: string
  charset?: string | null
  disposition?: "attachment" | "inline" | null
  cid?: string | null
  language?: string[] | null
  location?: string | null
  partIds?: string[] | null
  header?: Record<string, string[]> | null
}

export type EmailKeywordSet = Record<string, boolean>

export interface EmailProperties {
  id: JmapId
  blobId?: string
  threadId: JmapId
  mailboxIds: Record<JmapId, boolean>
  keywords?: EmailKeywordSet
  size?: number
  receivedAt?: JmapUtcDate
  sentAt?: JmapUtcDate
  headers?: Record<string, string[] | string>
  from?: EmailAddress[]
  to?: EmailAddress[]
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  sender?: EmailAddress[]
  replyTo?: EmailAddress[]
  subject?: string | null
  inReplyTo?: JmapId[]
  references?: JmapId[]
  messageId?: string | null
  preview?: string | null
  hasAttachment?: boolean
  htmlBody?: EmailBodyPart[]
  textBody?: EmailBodyPart[]
  bodyValues?: Record<
    string,
    { value?: string; isEncodingProblem?: boolean; isTruncated?: boolean }
  >
  attachments?: EmailBodyPart[]
}

export interface Mailbox {
  id: JmapId
  name: string
  parentId?: JmapId | null
  role?: MailboxRole | null
  sortOrder?: number
  totalEmails?: number
  unreadEmails?: number
  totalThreads?: number
  unreadThreads?: number
  myRights?: Record<string, boolean>
  isSubscribed?: boolean
  isSelectable?: boolean
}

export interface Thread {
  id: JmapId
  emailIds: JmapId[]
  snippet?: string | null
  read?: boolean
  starred?: boolean
  hasAttachment?: boolean
  unread?: boolean
  subject?: string | null
}

export interface Identity {
  id: JmapId
  name: string
  email: string
  replyTo?: EmailAddress[] | null
  bcc?: EmailAddress[] | null
  textSignature?: string | null
  htmlSignature?: string | null
  mayDelete?: boolean
  mayCreate?: boolean
}

export interface EmailSubmission {
  id: JmapId
  identityId: JmapId
  emailId: JmapId
  threadId: JmapId
  envelope?: { mailFrom?: EmailAddress; rcptTo?: EmailAddress[] }
  sendAt?: JmapUtcDate | null
  undoStatus?: "pending" | "final" | "cancelled"
  deliveryStatus?: Record<
    string,
    {
      smtpReply?: string
      delivered?: JmapUtcDate
      displayed?: JmapUtcDate
      displayedTo?: number
      dsns?: unknown[]
      mdns?: unknown[]
    }
  >
  dsnBlobIds?: JmapId[]
  mdnBlobIds?: JmapId[]
  trackingBlobIds?: JmapId[]
}

export interface EmailFilterCondition {
  inMailbox?: JmapId
  inMailboxOtherThan?: JmapId[]
  before?: JmapDate
  after?: JmapDate
  minSize?: number
  maxSize?: number
  allInThreadHaveKeyword?: Keyword
  someInThreadHaveKeyword?: Keyword
  noneInThreadHaveKeyword?: Keyword
  hasKeyword?: Keyword
  notKeyword?: Keyword
  hasAttachment?: boolean
  text?: string
  from?: string
  to?: string
  cc?: string
  bcc?: string
  body?: string
  subject?: string
}

export type EmailFilterOperator =
  | EmailFilterCondition
  | { operator: "AND" | "OR" | "NOT"; conditions: EmailFilterOperator[] }

export interface EmailSortComparator {
  property:
    | "receivedAt"
    | "sentAt"
    | "size"
    | "from"
    | "to"
    | "subject"
    | "hasKeyword"
    | "allInThreadHaveKeyword"
    | "someInThreadHaveKeyword"
    | "noneInThreadHaveKeyword"
  isAscending?: boolean
  keyword?: Keyword
  collation?: string
}

export interface EmailGetArgs {
  accountId: JmapId
  ids?: JmapId[] | null
  properties?: string[]
  fetchTextBodyValues?: boolean
  fetchHTMLBodyValues?: boolean
  fetchAllBodyValues?: boolean
  bodyProperties?: string[]
  fetchEmailBodyViews?: boolean
  maxBodyValueBytes?: number
}

export interface EmailGetResponse {
  accountId: JmapId
  state: string
  list: EmailProperties[]
  notFound: JmapId[]
}

export interface EmailQueryArgs {
  accountId: JmapId
  filter?: EmailFilterOperator
  sort?: EmailSortComparator[]
  position?: number
  anchor?: JmapId
  anchorOffset?: number
  limit?: number | null
  calculateTotal?: boolean
  collapseThreads?: boolean
  fetchThreads?: boolean
}

export interface EmailQueryResponse {
  accountId: JmapId
  queryState: string
  canCalculateChanges: boolean
  position: number
  ids: JmapId[]
  total?: number
  limit?: number | null
  filter?: EmailFilterOperator
  sort?: EmailSortComparator[]
}

export interface EmailSetArgs {
  accountId: JmapId
  ifInState?: string
  create?: Record<
    string,
    Partial<EmailProperties> & { mailboxIds?: Record<string, boolean> }
  >
  update?: Record<string, Partial<Record<string, unknown>>>
  destroy?: JmapId[]
}

export interface EmailSetResponse {
  accountId: JmapId
  oldState: string
  newState: string
  created?: Record<
    string,
    EmailProperties & { mailboxIds?: Record<string, boolean>; blobId?: string }
  >
  updated?: Record<string, EmailProperties | null>
  destroyed?: JmapId[]
  notCreated?: Record<string, { type: string; description?: string }>
  notUpdated?: Record<string, { type: string; description?: string }>
  notDestroyed?: Record<string, { type: string; description?: string }>
}

export interface MailboxSetResponse {
  accountId: JmapId
  oldState: string
  newState: string
  created?: Record<string, Mailbox>
  updated?: Record<string, Mailbox | null>
  destroyed?: JmapId[]
  notCreated?: Record<string, { type: string; description?: string }>
  notUpdated?: Record<string, { type: string; description?: string }>
  notDestroyed?: Record<string, { type: string; description?: string }>
}

export interface MailboxSetArgs {
  create?: Record<
    string,
    { name: string; parentId?: JmapId | null; isSubscribed?: boolean }
  >
  update?: Record<
    JmapId,
    { name?: string; parentId?: JmapId | null; isSubscribed?: boolean }
  >
  destroy?: JmapId[]
}

export interface EmailSubmissionSetArgs {
  accountId: JmapId
  ifInState?: string
  create?: Record<
    string,
    {
      identityId?: JmapId
      emailId?: JmapId
      envelope?: object
      sendAt?: string
    }
  >
  update?: Record<string, Record<string, unknown>>
  destroy?: JmapId[]
  onSuccessUpdateEmail?: Record<string, Record<string, unknown>>
}

export interface EmailSubmissionSetResponse {
  accountId: JmapId
  oldState: string
  newState: string
  created?: Record<string, EmailSubmission>
  updated?: Record<string, EmailSubmission | null>
  destroyed?: JmapId[]
  notCreated?: Record<string, { type: string; description?: string }>
}

export interface DraftCreationInput {
  mailboxIds?: Record<string, boolean>
  keywords?: EmailKeywordSet
  subject?: string | null
  to?: EmailAddress[]
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  from?: EmailAddress[]
  replyTo?: EmailAddress[]
  inReplyTo?: JmapId[]
  references?: JmapId[]
  textBody?: string
  htmlBody?: string
  attachments?: { blobId?: string; name?: string; type?: string }[]
}
