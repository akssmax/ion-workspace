/**
 * In-memory JMAP server used by the mock provider.
 *
 * Implements a pragmatic subset of the JMAP methods the app uses, with
 * realistic semantics: state ids per type, `Email/set` with client ids,
 * `EmailSubmission/set` (marks `$sent`, moves to Sent), result references,
 * and mutation events for the sync layer.
 */

import type {
  EmailFilterOperator,
  EmailProperties,
  EmailSortComparator,
  JmapId,
  Mailbox,
} from "../../types/mail"
import type { CalendarEvent } from "../../types/calendar"
import type { Contact, JsContactCard } from "../../types/contacts"
import {
  contactFromJsContact,
  contactToJsContactCreate,
} from "../../types/contacts"
import type { FileNode } from "../../types/files"
import { JMAP_CAPS } from "../../types"
import {
  MOCK_ACCOUNT_ID,
  createSeedData,
  type MockEmailSeed,
  type MockSeedData,
} from "./data"
import type { JmapSession } from "../../types"

type JsonValue = unknown

interface Invocation {
  id: string
  method: string
  args: Record<string, unknown>
  options?: Record<string, unknown>
}

interface StoredEmail extends Omit<EmailProperties, "textBody" | "htmlBody"> {
  textBody?: string
  htmlBody?: string
  attachments?: {
    blobId: string
    name: string
    type: string
    size: number
    content: string
  }[]
  messageId?: string | null
  version: number
  uid: string
}

interface StoredBlob {
  blobId: string
  name: string
  type: string
  size: number
  content: string
}

export interface MockPushEvent {
  type: string
  args: Record<string, unknown>
  callId?: string
}

/**
 * Minimal event emitter consumed by MockTransport to simulate server push.
 */
export class MockEventEmitter {
  private listeners = new Set<(event: MockPushEvent) => void>()

  on(fn: (event: MockPushEvent) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  emit(event: MockPushEvent): void {
    for (const fn of this.listeners) fn(event)
  }
}

export class MockServer {
  readonly emitter = new MockEventEmitter()
  session: JmapSession

  private mailboxes: Mailbox[] = []
  private emails = new Map<string, StoredEmail>()
  private identities: { id: string; name: string; email: string }[] = []
  private vacation = {
    id: "singleton",
    isEnabled: false,
    fromDate: null as string | null,
    toDate: null as string | null,
    subject: null as string | null,
    textBody: null as string | null,
  }
  private sieveScripts: {
    id: string
    name: string
    blobId: string
    isActive: boolean
  }[] = []
  private calendars: {
    id: string
    name: string
    color?: string
    order?: number
  }[] = []
  private events = new Map<string, CalendarEvent>()
  private addressBooks: { id: string; name: string }[] = []
  private contacts = new Map<string, Contact>()
  private groups: { id: string; names: string[] }[] = []
  private fileNodes = new Map<string, FileNode & { content?: string }>()
  private blobs = new Map<string, StoredBlob>()

  private stateCounter = new Map<string, number>()
  private nextIdCounter = 1

  private readonly seed: MockSeedData

  constructor(accountId = MOCK_ACCOUNT_ID) {
    this.seed = createSeedData()
    this.seedData(accountId)
    this.session = this.createSession(accountId)
  }

  private seedData(accountId: string): void {
    const seed = this.seed
    void accountId

    for (const mb of seed.mailboxes) {
      this.mailboxes.push({
        id: mb.id,
        name: mb.name,
        role: mb.role as Mailbox["role"],
        sortOrder: mb.order ?? 0,
        totalEmails: 0,
        unreadEmails: 0,
        totalThreads: 0,
        unreadThreads: 0,
        isSubscribed: true,
      })
    }

    for (const email of seed.emails) {
      this.emails.set(email.id, this.fromSeedEmail(email))
    }

    for (const blob of this.collectBlobs(seed.emails)) {
      this.blobs.set(blob.blobId, blob)
    }

    this.identities = seed.identities
    this.calendars = seed.calendars
    for (const ev of seed.events) this.events.set(ev.id, ev)
    this.addressBooks = seed.addressBooks
    for (const c of seed.contacts) {
      this.contacts.set(c.id, this.fromSeedContact(c))
    }
    this.groups = seed.groups
    for (const fn of seed.fileNodes) {
      const copy: FileNode & { content?: string } = { ...fn }
      if (fn.content) {
        copy.content = fn.content
        this.blobs.set(fn.id, {
          blobId: fn.id,
          name: fn.name,
          type: fn.contentType ?? "application/octet-stream",
          size: fn.size,
          content: fn.content,
        })
      }
      this.fileNodes.set(fn.id, copy)
    }

    // Recalculate mailbox counters.
    this.recalculate()

    // init state counter high enough that changes work.
    this.stateCounter.set("Mailbox", 100)
    this.stateCounter.set("Email", 100)
    this.stateCounter.set("Thread", 100)
    this.stateCounter.set("Calendar", 100)
    this.stateCounter.set("CalendarEvent", 100)
    this.stateCounter.set("AddressBook", 100)
    this.stateCounter.set("Contact", 100)
    this.stateCounter.set("FileNode", 100)
    this.nextIdCounter = 1000
  }

  private fromSeedEmail(seed: MockEmailSeed): StoredEmail {
    return {
      id: seed.id,
      threadId: seed.threadId,
      mailboxIds: seed.mailboxIds,
      keywords: seed.keywords ?? {},
      from: seed.from ?? [],
      to: seed.to ?? [],
      cc: seed.cc ?? [],
      bcc: seed.bcc ?? [],
      replyTo: seed.replyTo ?? [],
      subject: seed.subject,
      sentAt: seed.sentAt,
      receivedAt: seed.receivedAt,
      size: (seed.textBody?.length ?? 0) + 100,
      preview: seed.textBody?.slice(0, 120),
      hasAttachment: seed.hasAttachment ?? !!seed.attachments?.length,
      inReplyTo: seed.inReplyTo,
      references: seed.references,
      messageId: seed.messageId,
      textBody: seed.textBody,
      htmlBody: seed.htmlBody,
      attachments: seed.attachments,
      headers: seed.headers,
      version: 100,
      uid: seed.id,
    }
  }

  private fromSeedContact(seed: (typeof this.seed.contacts)[number]): Contact {
    return {
      id: seed.id,
      addressBookIds: seed.addressBookIds ?? { ab_main: true },
      fn: seed.fn,
      n: seed.n as Contact["n"],
      organization: seed.organization,
      emails: seed.emails as Contact["emails"],
      phones: seed.phones as Contact["phones"],
      nickname: seed.nickname,
    }
  }

  private collectBlobs(emails: MockEmailSeed[]): StoredBlob[] {
    const out: StoredBlob[] = []
    for (const email of emails) {
      for (const a of email.attachments ?? []) {
        out.push({
          blobId: a.blobId,
          name: a.name,
          type: a.type,
          size: a.size,
          content: a.content,
        })
      }
    }
    return out
  }

  private createSession(accountId: string): JmapSession {
    return {
      username: MOCK_ACCOUNT_ID,
      state: "session-1",
      apiUrl: "mock://jmap",
      uploadUrl: "mock://upload/{accountId}",
      downloadUrl: "mock://download/{accountId}/{blobId}",
      eventSourceUrl: "mock://eventsource",
      accounts: {
        [accountId]: {
          id: accountId,
          name: "You",
          isPersonal: true,
          isReadOnly: false,
          accountCapabilities: {
            mail: { maxMailboxesPerEmail: 20, mayCreateTopLevelMailbox: true },
            calendars: { maxEventsPerEmail: 1 },
            contacts: { mayCreateTopLevelAddressBooks: true },
            files: { maxDepth: 10 },
            [JMAP_CAPS.MAIL]: { maxMailboxesPerEmail: 20 },
            [JMAP_CAPS.SUBMISSION]: {},
            [JMAP_CAPS.CALENDARS]: {},
            [JMAP_CAPS.CONTACTS]: {},
            [JMAP_CAPS.FILES]: {},
            "urn:ietf:params:jmap:vacationresponse": {},
            "urn:ietf:params:jmap:sieve": {},
          },
        },
      },
      primaryAccounts: {
        [JMAP_CAPS.MAIL]: accountId,
        [JMAP_CAPS.SUBMISSION]: accountId,
        [JMAP_CAPS.CALENDARS]: accountId,
        [JMAP_CAPS.CONTACTS]: accountId,
        [JMAP_CAPS.FILES]: accountId,
        "urn:ietf:params:jmap:vacationresponse": accountId,
        "urn:ietf:params:jmap:sieve": accountId,
      },
      capabilities: {
        [JMAP_CAPS.CORE]: {
          maxSizeUpload: 50_000_000,
          maxConcurrentUpload: 4,
          maxSizeRequest: 10_000_000,
          maxCallsInRequest: 100,
          maxObjectsInGet: 500,
          maxObjectsInSet: 500,
          collationAlgorithms: ["i;ascii-numeric", "i;ascii-case-insensitive"],
        },
        [JMAP_CAPS.MAIL]: {
          maxMailboxesPerEmail: 20,
          maxSizeAttachmentsPerEmail: 50_000_000,
          emailQuerySortOptions: [
            "receivedAt",
            "sentAt",
            "subject",
            "from",
            "to",
            "size",
          ],
          mayCreateTopLevelMailbox: true,
        },
        [JMAP_CAPS.SUBMISSION]: {},
        [JMAP_CAPS.CALENDARS]: {
          maxEventsPerEmail: 1,
          mayCreateTopLevelCalendars: true,
        },
        [JMAP_CAPS.CONTACTS]: { mayCreateTopLevelAddressBooks: true },
        [JMAP_CAPS.FILES]: { maxDepth: 10, allowedContentTypes: ["*"] },
        "urn:ietf:params:jmap:vacationresponse": {},
        "urn:ietf:params:jmap:sieve": {},
      },
    }
  }

  /**
   * Handle a full JMAP request body.
   */
  async handle(payload: JsonValue[]): Promise<JsonValue[]> {
    if (!Array.isArray(payload) || payload.length === 0) {
      return [
        [
          "error",
          { type: "serverUnavailable", description: "Invalid JMAP request." },
          "0",
        ],
      ]
    }
    const firstEntry = payload[0] as unknown[]
    const capStyle =
      Array.isArray(firstEntry) &&
      firstEntry[0] === JMAP_CAPS.CORE &&
      Array.isArray(firstEntry[1]) === false &&
      typeof (firstEntry[1] as { using?: unknown } | undefined)?.using ===
        "object"

    // Requests that omit the leading capability entry (e.g. the client
    // discovering the session document) are answered without one too.
    const using = capStyle
      ? (((firstEntry[1] as { using?: string[] }).using ?? []) as string[])
      : [JMAP_CAPS.CORE]

    if (!using.includes(JMAP_CAPS.CORE)) {
      return H([
        "error",
        {
          type: "unknownCapability",
          description: "The urn:ietf:params:jmap:core capability is required.",
        },
        "0",
      ])
    }

    const invocations = (
      (capStyle ? payload.slice(1) : payload) as JsonValue[]
    ).map((entry) => {
      const [method, args, id, options] = entry as [
        string,
        Record<string, unknown>,
        string,
        Record<string, unknown>?,
      ]
      return { method, args: args ?? {}, id, options } satisfies Invocation
    })

    const responses = new Map<string, JsonValue[]>()
    const out: JsonValue[] = []
    if (capStyle) {
      out.push([
        JMAP_CAPS.CORE,
        { using },
        String(firstEntry[2] ?? "d0"),
      ] as unknown as JsonValue)
    }
    for (const inv of invocations) {
      // Resolve result references (which refer to earlier calls) before dispatch.
      const args = this.resolveReferences(inv, responses)
      const response = this.dispatch(inv.method, args, inv.id)
      responses.set(inv.id, response)
      out.push(response)
    }
    return out
  }

  // -- dispatch -----------------------------------------------------------

  private dispatch(
    method: string,
    args: Record<string, unknown>,
    callId: string
  ): JsonValue[] {
    try {
      switch (method) {
        case "Core/session":
          return H(["Core/session", this.session, callId])
        case "Mailbox/get":
          return H(["Mailbox/get", this.mailboxGet(args), callId])
        case "Mailbox/set":
          return H(["Mailbox/set", this.mailboxSet(args), callId])
        case "Email/query":
          return H(["Email/query", this.emailQuery(args), callId])
        case "Email/get":
          return H(["Email/get", this.emailGet(args), callId])
        case "Email/set":
          return H(["Email/set", this.emailSet(args), callId])
        case "Thread/get":
          return H(["Thread/get", this.threadGet(args), callId])
        case "EmailSubmission/set":
          return H(["EmailSubmission/set", this.submissionSet(args), callId])
        case "Identity/get":
          return H(["Identity/get", this.identityGet(args), callId])
        case "Identity/set":
          return H(["Identity/set", this.identitySet(args), callId])
        case "VacationResponse/get":
          return H([
            "VacationResponse/get",
            {
              accountId: String(args.accountId),
              state: this.state("VacationResponse"),
              list: [this.vacation],
              notFound: [],
            },
            callId,
          ])
        case "VacationResponse/set":
          this.vacation = {
            ...this.vacation,
            ...((
              args.update as Record<string, typeof this.vacation> | undefined
            )?.singleton ?? {}),
          }
          return H([
            "VacationResponse/set",
            {
              accountId: String(args.accountId),
              oldState: this.state("VacationResponse"),
              newState: this.state("VacationResponse"),
              updated: { singleton: null },
            },
            callId,
          ])
        case "SieveScript/get":
          return H([
            "SieveScript/get",
            {
              accountId: String(args.accountId),
              state: this.state("SieveScript"),
              list: this.sieveScripts,
              notFound: [],
            },
            callId,
          ])
        case "SieveScript/validate":
          return H([
            "SieveScript/validate",
            { accountId: String(args.accountId), error: null },
            callId,
          ])
        case "SieveScript/set": {
          const created: Record<string, { id: string }> = {},
            updated: Record<string, null> = {}
          const create = args.create as
            Record<string, { name: string; blobId: string }> | undefined
          const update = args.update as
            Record<string, { blobId: string }> | undefined
          if (create)
            for (const [key, item] of Object.entries(create)) {
              const id = `sieve-${this.nextIdCounter++}`
              this.sieveScripts.push({ id, ...item, isActive: true })
              created[key] = { id }
            }
          if (update)
            for (const [id, item] of Object.entries(update)) {
              const script = this.sieveScripts.find((entry) => entry.id === id)
              if (script) {
                script.blobId = item.blobId
                script.isActive = true
                updated[id] = null
              }
            }
          return H([
            "SieveScript/set",
            {
              accountId: String(args.accountId),
              oldState: this.state("SieveScript"),
              newState: this.state("SieveScript"),
              created,
              updated,
            },
            callId,
          ])
        }
        case "Email/changes":
          return H(["Email/changes", this.changes("Email", args), callId])
        case "Mailbox/changes":
          return H(["Mailbox/changes", this.changes("Mailbox", args), callId])
        case "Calendar/get":
          return H(["Calendar/get", this.calendarGet(args), callId])
        case "Calendar/set":
          return H(["Calendar/set", this.calendarSet(args), callId])
        case "CalendarEvent/query":
          return H([
            "CalendarEvent/query",
            this.calendarEventQuery(args),
            callId,
          ])
        case "CalendarEvent/get":
          return H(["CalendarEvent/get", this.calendarEventGet(args), callId])
        case "CalendarEvent/set":
          return H(["CalendarEvent/set", this.calendarEventSet(args), callId])
        case "AddressBook/get":
          return H(["AddressBook/get", this.addressBookGet(args), callId])
        case "ContactCard/query":
          return H(["ContactCard/query", this.contactQuery(args), callId])
        case "ContactCard/get":
          return H(["ContactCard/get", this.contactGet(args), callId])
        case "ContactCard/set":
          return H(["ContactCard/set", this.contactSet(args), callId])
        case "ContactGroup/get":
          return H(["ContactGroup/get", this.contactGroupGet(args), callId])
        case "FileNode/get":
          return H(["FileNode/get", this.fileNodeGet(args), callId])
        case "FileNode/set":
          return H(["FileNode/set", this.fileNodeSet(args), callId])
        default:
          return H([
            "error",
            {
              type: "unknownMethod",
              description: `The mock server does not implement ${method}.`,
            },
            callId,
          ])
      }
    } catch (error) {
      return H([
        "error",
        {
          type: "serverFail",
          description:
            error instanceof Error ? error.message : "Mock server failure",
        },
        callId,
      ])
    }
  }

  // -- core helpers ---------------------------------------------------------

  private state(type: string): string {
    return String(this.stateCounter.get(type) ?? 0)
  }

  private tick(type: string): string {
    const next = (this.stateCounter.get(type) ?? 0) + 1
    this.stateCounter.set(type, next)
    return String(next)
  }

  private track(type: string): void {
    // bump state and emit push event for the synced types
    if (
      type === "Email" ||
      type === "Mailbox" ||
      type === "CalendarEvent" ||
      type === "Contact" ||
      type === "FileNode"
    ) {
      const newState = this.tick(type)
      this.emitter.emit({
        type,
        args: { changed: true, newState },
        callId: undefined,
      })
    }
  }

  private newId(prefix: string): JmapId {
    return `${prefix}_${(this.nextIdCounter++).toString(36)}`
  }

  // -- resolveReferences ------------------------------------------------------

  private resolveReferences(
    inv: Invocation,
    responses: Map<string, JsonValue[]>
  ): Record<string, unknown> {
    const raw = inv.args
    const refValue = (callId: string, path?: string): unknown => {
      const stored = responses.get(callId)
      if (!stored || !Array.isArray(stored) || stored.length < 2) {
        throw new Error(`Result reference to unknown call ${callId}.`)
      }
      const responseArgs = stored[1] as Record<string, unknown>
      return path && path !== "/"
        ? resolvePath(responseArgs, path)
        : responseArgs
    }

    const referenceFor = (value: string): unknown => {
      const callId = value.slice(1)
      const ro = inv.options?.resultOf as
        { callId?: string; path?: string } | undefined
      const path = ro && ro.callId === callId ? ro.path : undefined
      return refValue(callId, path)
    }

    const walk = (value: unknown): unknown => {
      if (typeof value === "string" && value.startsWith("#")) {
        return referenceFor(value)
      }
      if (Array.isArray(value)) {
        const out: unknown[] = []
        for (const item of value) {
          if (typeof item === "string" && item.startsWith("#")) {
            // A resolved array fills the enclosing array field (RFC 8620 §3.5).
            const resolved = referenceFor(item)
            if (Array.isArray(resolved)) out.push(...resolved)
            else out.push(resolved)
          } else {
            out.push(walk(item))
          }
        }
        return out
      }
      if (value && typeof value === "object") {
        const out: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(value as Record<string, unknown>))
          out[k] = k === "onSuccessActivateScript" ? v : walk(v)
        return out
      }
      return value
    }

    return walk(raw) as Record<string, unknown>
  }

  // -- Mailbox ---------------------------------------------------------------

  private mailboxGet(args: Record<string, unknown>) {
    const ids = args.ids as JmapId[] | null | undefined
    const list = this.mailboxes.filter((m) => !ids || ids.includes(m.id))
    return {
      accountId: String(args.accountId),
      state: this.state("Mailbox"),
      list,
      notFound: [],
    }
  }

  private mailboxSet(args: Record<string, unknown>) {
    const oldState = this.state("Mailbox")
    const created: Record<string, Mailbox> = {}
    const updated: Record<string, Mailbox | null> = {}
    const destroyed: JmapId[] = []
    const notCreated: Record<string, { type: string; description?: string }> =
      {}
    const notUpdated: Record<string, { type: string; description?: string }> =
      {}
    const notDestroyed: Record<string, { type: string; description?: string }> =
      {}

    for (const [cid, patch] of Object.entries(
      (args.create as
        | Record<
            string,
            { name?: string; parentId?: string | null; isSubscribed?: boolean }
          >
        | undefined) ?? {}
    )) {
      const name = patch.name?.trim()
      if (!name) {
        notCreated[cid] = {
          type: "invalidProperties",
          description: "A mailbox name is required.",
        }
        continue
      }
      if (
        this.mailboxes.some((m) => m.name.toLowerCase() === name.toLowerCase())
      ) {
        notCreated[cid] = {
          type: "invalidProperties",
          description: `A mailbox named "${name}" already exists.`,
        }
        continue
      }
      const mailbox: Mailbox = {
        id: this.newId("mbox"),
        name,
        parentId: patch.parentId ?? null,
        role: null,
        sortOrder: this.mailboxes.length,
        totalEmails: 0,
        unreadEmails: 0,
        totalThreads: 0,
        unreadThreads: 0,
        isSubscribed: patch.isSubscribed ?? true,
        myRights: { mayReadItems: true, mayAddItems: true, mayDelete: true },
      }
      this.mailboxes.push(mailbox)
      created[cid] = mailbox
    }

    for (const [id, patch] of Object.entries(
      (args.update as
        | Record<
            string,
            { name?: string; parentId?: string | null; isSubscribed?: boolean }
          >
        | undefined) ?? {}
    )) {
      const mailbox = this.mailboxes.find((m) => m.id === id)
      if (!mailbox) {
        notUpdated[id] = { type: "notFound" }
        continue
      }
      if (patch.name !== undefined) {
        const name = patch.name.trim()
        if (!name) {
          notUpdated[id] = {
            type: "invalidProperties",
            description: "A mailbox name is required.",
          }
          continue
        }
        mailbox.name = name
      }
      if (patch.parentId !== undefined) mailbox.parentId = patch.parentId
      if (patch.isSubscribed !== undefined)
        mailbox.isSubscribed = patch.isSubscribed
      updated[id] = mailbox
    }

    for (const id of (args.destroy as JmapId[] | undefined) ?? []) {
      const mailbox = this.mailboxes.find((m) => m.id === id)
      if (!mailbox) {
        notDestroyed[id] = { type: "notFound" }
        continue
      }
      if (mailbox.role) {
        notDestroyed[id] = {
          type: "forbidden",
          description: `The ${mailbox.role} mailbox cannot be deleted.`,
        }
        continue
      }
      this.mailboxes = this.mailboxes.filter((m) => m.id !== id)
      // Emails left in no mailbox at all are destroyed (RFC 8621 semantics).
      for (const email of this.emails.values()) {
        if (email.mailboxIds[id]) {
          delete email.mailboxIds[id]
          if (Object.keys(email.mailboxIds).length === 0) {
            this.emails.delete(email.id)
          }
        }
      }
      destroyed.push(id)
    }

    if (
      Object.keys(created).length ||
      Object.keys(updated).length ||
      destroyed.length
    ) {
      this.track("Mailbox")
    }

    return {
      accountId: String(args.accountId),
      oldState,
      newState: this.state("Mailbox"),
      ...(Object.keys(created).length ? { created } : {}),
      ...(Object.keys(updated).length ? { updated } : {}),
      ...(destroyed.length ? { destroyed } : {}),
      ...(Object.keys(notCreated).length ? { notCreated } : {}),
      ...(Object.keys(notUpdated).length ? { notUpdated } : {}),
      ...(Object.keys(notDestroyed).length ? { notDestroyed } : {}),
    }
  }

  // -- Email -----------------------------------------------------------------

  private emailQuery(args: Record<string, unknown>) {
    const filter = args.filter as EmailFilterOperator | undefined
    const sort = (args.sort as EmailSortComparator[] | undefined) ?? [
      { property: "receivedAt", isAscending: false },
    ]
    const limit = args.limit as number | null | undefined
    const collapse = args.collapseThreads as boolean | undefined
    const calculateTotal = args.calculateTotal as boolean | undefined
    const position = (args.position as number | undefined) ?? 0

    let emails = [...this.emails.values()]
    if (filter) emails = emails.filter((e) => this.matchesFilter(e, filter))
    emails.sort((a, b) => compareEmails(a, b, sort))

    if (collapse) {
      const seen = new Map<string, StoredEmail>()
      for (const e of emails) {
        if (!seen.has(e.threadId)) seen.set(e.threadId, e)
      }
      emails = [...seen.values()]
    }

    const total = emails.length
    const page = emails.slice(
      position,
      limit == null ? undefined : position + limit
    )
    return {
      accountId: String(args.accountId),
      queryState: this.state("Email"),
      canCalculateChanges: true,
      position,
      ids: page.map((e) => e.id),
      ...(calculateTotal ? { total } : {}),
      limit: limit ?? null,
      ...(filter ? { filter } : {}),
      ...(sort ? { sort } : {}),
    }
  }

  private matchesFilter(
    email: StoredEmail,
    filter: EmailFilterOperator
  ): boolean {
    if ("operator" in filter) {
      if (filter.operator === "AND")
        return filter.conditions.every((f) => this.matchesFilter(email, f))
      if (filter.operator === "OR")
        return filter.conditions.some((f) => this.matchesFilter(email, f))
      return filter.conditions.every((f) => !this.matchesFilter(email, f))
    }

    const f = filter
    if (f.inMailbox && !email.mailboxIds[f.inMailbox]) return false
    if (
      f.inMailboxOtherThan &&
      !Object.keys(email.mailboxIds).some(
        (id) => !f.inMailboxOtherThan!.includes(id)
      )
    )
      return false
    if (f.hasKeyword && !email.keywords?.[f.hasKeyword]) return false
    if (f.notKeyword && email.keywords?.[f.notKeyword]) return false
    if (f.hasAttachment && !email.hasAttachment) return false
    if (f.after && email.receivedAt && email.receivedAt < f.after) return false
    if (f.before && email.receivedAt && email.receivedAt >= f.before)
      return false
    if (
      f.subject &&
      !(email.subject ?? "").toLowerCase().includes(f.subject.toLowerCase())
    )
      return false
    if (f.from) {
      const from = email.from?.[0]?.email.toLowerCase() ?? ""
      if (!from.includes(f.from.toLowerCase())) return false
    }
    if (f.to) {
      const tos = email.to?.map((t) => t.email.toLowerCase()).join(" ") ?? ""
      if (!tos.includes(f.to.toLowerCase())) return false
    }
    if (f.text) {
      const haystack =
        `${email.subject ?? ""} ${email.preview ?? ""} ${email.textBody ?? ""} ${email.from?.[0]?.email ?? ""} ${email.from?.[0]?.name ?? ""}`.toLowerCase()
      if (!haystack.includes(f.text.toLowerCase())) return false
    }
    return true
  }

  private emailGet(args: Record<string, unknown>) {
    const ids = args.ids as JmapId[] | null | undefined
    const properties = args.properties as string[] | undefined
    const fetchText = args.fetchTextBodyValues
    const fetchHtml = args.fetchHTMLBodyValues
    const list: EmailProperties[] = []
    const notFound: JmapId[] = []
    for (const email of this.emails.values()) {
      if (ids && !ids.includes(email.id)) continue
      const out: EmailProperties = {} as EmailProperties
      Object.defineProperty(out, "id", {
        value: email.id,
        enumerable: true,
        configurable: true,
      })
      for (const prop of properties ?? []) {
        if (prop === "textBody" || prop === "htmlBody") {
          const isText = prop === "textBody"
          const fetch = isText ? fetchText : fetchHtml
          const id = isText ? "1" : "2"
          out[prop] = [
            {
              partId: id,
              blobId: null,
              type: isText ? "text/plain" : "text/html",
            },
          ]
          if (fetch) {
            const content = isText
              ? (email.textBody ?? "")
              : (email.htmlBody ?? email.textBody ?? "")
            const values = { [id]: { value: content } }
            out.bodyValues = { ...(out.bodyValues ?? {}), ...values }
          }
        } else if (prop === "bodyValues" || prop === "headers") {
          if (prop === "headers" && email.headers) {
            out.headers = structuredClone(email.headers)
          }
        } else {
          const value = (email as unknown as Record<string, unknown>)[prop]
          Object.defineProperty(out, prop, {
            value: value === undefined ? undefined : structuredClone(value),
            enumerable: true,
            configurable: true,
          })
        }
      }
      list.push(out)
    }
    if (ids) {
      const found = new Set(list.map((e) => e.id))
      for (const id of ids) if (!found.has(id)) notFound.push(id)
    }
    return {
      accountId: String(args.accountId),
      state: this.state("Email"),
      list,
      notFound,
    }
  }

  private emailSet(args: Record<string, unknown>) {
    const created: Record<string, EmailProperties> = {}
    const updated: Record<string, EmailProperties | null> = {}
    const destroyed: JmapId[] = []
    const notCreated: Record<string, { type: string; description?: string }> =
      {}
    const notUpdated: Record<string, { type: string; description?: string }> =
      {}
    const notDestroyed: Record<string, { type: string; description?: string }> =
      {}
    const createdIdMap: Record<string, string> = {}

    for (const [cid, patch] of Object.entries(
      (args.create as Record<string, Partial<StoredEmail>> | undefined) ?? {}
    )) {
      try {
        const id = this.newId("e")
        const parent = patch.inReplyTo
          ?.map((reference) =>
            [...this.emails.values()].find(
              (message) =>
                message.id === reference || message.messageId === reference
            )
          )
          .find(Boolean)
        const mailboxIds = normalizeMailboxIds(
          patch.mailboxIds ?? {},
          this.mailboxes
        )
        const email: StoredEmail = {
          id,
          threadId:
            (patch.threadId as string) ?? parent?.threadId ?? this.newId("thr"),
          messageId: `<${id}@mock.local>`,
          mailboxIds,
          keywords:
            (patch.keywords as Record<string, boolean> | undefined) ?? {},
          from: patch.from ?? [],
          to: patch.to ?? [],
          cc: patch.cc ?? [],
          bcc: patch.bcc ?? [],
          subject: patch.subject,
          inReplyTo: patch.inReplyTo,
          references: patch.references,
          sentAt: patch.sentAt ?? new Date().toISOString(),
          receivedAt: new Date().toISOString(),
          size: 0,
          preview: extractPreview(patch),
          textBody: bodyContent(patch.textBody, patch.bodyValues),
          htmlBody: bodyContent(patch.htmlBody, patch.bodyValues),
          attachments: patch.attachments as StoredEmail["attachments"],
          hasAttachment:
            (patch.hasAttachment as boolean | undefined) ??
            !!patch.attachments?.length,
          version: (this.stateCounter.get("Email") ?? 0) + 1,
          uid: this.newId("uid"),
        }
        this.emails.set(id, email)
        created[cid] = email as unknown as EmailProperties
        createdIdMap[cid] = id
      } catch (error) {
        notCreated[cid] = {
          type: "serverFail",
          description: error instanceof Error ? error.message : "create failed",
        }
      }
    }

    for (const [id, patch] of Object.entries(
      (args.update as Record<string, Record<string, unknown>> | undefined) ?? {}
    )) {
      const email = this.emails.get(id)
      if (!email) {
        notUpdated[id] = { type: "notFound" }
        continue
      }
      try {
        // RFC 8620 patch syntax: "keywords/$seen": true patches one key;
        // a plain "keywords" object replaces the whole map.
        for (const [key, value] of Object.entries(patch)) {
          if (key.startsWith("keywords/")) {
            const kw = key.slice("keywords/".length)
            email.keywords ??= {}
            if (value) email.keywords[kw] = true
            else delete email.keywords[kw]
          } else if (key.startsWith("mailboxIds/")) {
            const mb = key.slice("mailboxIds/".length)
            if (value) email.mailboxIds[mb] = true
            else delete email.mailboxIds[mb]
          }
        }
        if ("keywords" in patch)
          email.keywords = patch.keywords as Record<string, boolean>
        if ("mailboxIds" in patch)
          email.mailboxIds = normalizeMailboxIds(
            patch.mailboxIds as Record<string, boolean>,
            this.mailboxes
          )
        // An email removed from all mailboxes is destroyed (RFC 8621 §4.1).
        if (Object.keys(email.mailboxIds).length === 0) {
          this.emails.delete(id)
          updated[id] = null
          continue
        }
        if ("subject" in patch) email.subject = patch.subject as string | null
        if ("inReplyTo" in patch) email.inReplyTo = patch.inReplyTo as string[]
        if ("references" in patch)
          email.references = patch.references as string[]
        if ("to" in patch) email.to = patch.to as EmailProperties["to"]
        if ("cc" in patch) email.cc = patch.cc as EmailProperties["cc"]
        if ("bcc" in patch) email.bcc = patch.bcc as EmailProperties["bcc"]
        if ("from" in patch) email.from = patch.from as EmailProperties["from"]
        if ("textBody" in patch)
          email.textBody = bodyContent(patch.textBody, patch.bodyValues)
        if ("htmlBody" in patch)
          email.htmlBody = bodyContent(patch.htmlBody, patch.bodyValues)
        if ("attachments" in patch)
          email.attachments = patch.attachments as StoredEmail["attachments"]
        email.preview = extractPreviewEmail(email)
        email.version = (this.stateCounter.get("Email") ?? 0) + 1
        updated[id] = email as unknown as EmailProperties
      } catch (error) {
        notUpdated[id] = {
          type: "serverFail",
          description: error instanceof Error ? error.message : "update failed",
        }
      }
    }

    for (const id of (args.destroy as JmapId[] | undefined) ?? []) {
      if (this.emails.delete(id)) destroyed.push(id)
      else notDestroyed[id] = { type: "notFound" }
    }

    const oldState = this.state("Email")
    if (
      Object.keys(created).length ||
      Object.keys(updated).length ||
      destroyed.length
    ) {
      this.tick("Email")
      this.track("Email")
      this.recalculate()
    } else {
      this.track("Email")
    }

    return {
      accountId: String(args.accountId),
      oldState,
      newState: this.state("Email"),
      ...(Object.keys(created).length ? { created } : {}),
      ...(Object.keys(updated).length ? { updated } : {}),
      ...(destroyed.length ? { destroyed } : {}),
      ...(Object.keys(notCreated).length ? { notCreated } : {}),
      ...(Object.keys(notUpdated).length ? { notUpdated } : {}),
      ...(Object.keys(notDestroyed).length ? { notDestroyed } : {}),
      _createdIdMap: createdIdMap,
    }
  }

  private threadGet(args: Record<string, unknown>) {
    const ids = args.ids as JmapId[]
    const list = ids.map((id) => {
      const emails = [...this.emails.values()]
        .filter((e) => e.threadId === id)
        .sort((a, b) => (a.receivedAt! > b.receivedAt! ? -1 : 1))
      if (emails.length === 0) return null
      const latest = emails[0]
      return {
        id,
        emailIds: emails
          .map((e) => e.id)
          .sort((a, b) =>
            this.emails.get(a)!.receivedAt! > this.emails.get(b)!.receivedAt!
              ? 1
              : -1
          ),
        snippet: latest.textBody?.slice(0, 100),
        read: !latest.keywords?.$seen,
        starred: !!latest.keywords?.$flagged,
        hasAttachment: emails.some((e) => e.hasAttachment),
        unread: !latest.keywords?.$seen,
        subject: latest.subject,
      }
    })
    return {
      accountId: String(args.accountId),
      state: this.state("Thread"),
      list,
      notFound: [],
    }
  }

  private submissionSet(args: Record<string, unknown>) {
    const created: Record<
      string,
      { id: string; identityId?: string; emailId?: string }
    > = {}
    const notCreated: Record<string, { type: string; description?: string }> =
      {}
    const updated = args.update as Record<string, unknown> | undefined

    for (const [sid, patch] of Object.entries(
      (args.create as
        | Record<string, { emailId?: string; identityId?: string }>
        | undefined) ?? {}
    )) {
      const emailId = patch.emailId
      if (!emailId) {
        notCreated[sid] = {
          type: "invalidArguments",
          description: "emailId is required.",
        }
        continue
      }
      const email = this.emails.get(emailId)
      if (!email) {
        notCreated[sid] = {
          type: "blobNotFound",
          description: "emailId not found.",
        }
        continue
      }
      const submissionId = this.newId("sub")
      created[sid] = { id: submissionId, identityId: patch.identityId, emailId }

      // Simulate send side effects: mark $sent, remove $draft, move to Sent.
      email.keywords = { ...(email.keywords ?? {}), $sent: true }
      delete email.keywords.$draft
      email.mailboxIds = { mbox_sent: true }
      email.version += 1
      this.tick("Email")
      this.track("Email")
    }

    if (updated) {
      for (const id of Object.keys(updated)) {
        void id
      }
    }

    return {
      accountId: String(args.accountId),
      oldState: this.state("EmailSubmission"),
      newState: this.state("EmailSubmission"),
      ...(Object.keys(created).length ? { created } : {}),
      ...(Object.keys(notCreated).length ? { notCreated } : {}),
    }
  }

  private identityGet(args: Record<string, unknown>) {
    return {
      accountId: String(args.accountId),
      state: this.state("Identity"),
      list: this.identities,
      notFound: [],
    }
  }

  private identitySet(args: Record<string, unknown>) {
    const update = (args.update ?? {}) as Record<
      string,
      { name?: string; textSignature?: string }
    >
    const updated: Record<string, null> = {}
    const notUpdated: Record<string, { type: string }> = {}
    for (const [id, patch] of Object.entries(update)) {
      const identity = this.identities.find((item) => item.id === id)
      if (!identity) {
        notUpdated[id] = { type: "notFound" }
        continue
      }
      if (patch.name !== undefined) identity.name = patch.name
      updated[id] = null
    }
    return {
      accountId: String(args.accountId),
      oldState: this.state("Identity"),
      newState: this.state("Identity"),
      updated,
      notUpdated,
    }
  }

  // -- changes --------------------------------------------------------------

  private changes(type: string, args: Record<string, unknown>) {
    const sinceState = Number(args.sinceState ?? 0)
    const current = this.stateCounter.get(type) ?? 0
    const maxChanges = (args.maxChanges as number | undefined) ?? 500
    const created =
      current > sinceState
        ? type === "Email"
          ? [...this.emails.keys()].filter(
              (id) => (this.emails.get(id)?.version ?? 0) > sinceState
            )
          : type === "CalendarEvent"
            ? [...this.events.keys()]
            : type === "Contact"
              ? [...this.contacts.keys()]
              : type === "FileNode"
                ? [...this.fileNodes.keys()]
                : [...this.mailboxes.map((m) => m.id)]
        : []
    const hasMore = created.length > maxChanges
    return {
      accountId: String(args.accountId),
      oldState: String(sinceState),
      newState: this.state(type),
      created: created.slice(0, maxChanges),
      updated: [],
      destroyed: [],
      hasMoreChanges: hasMore,
    }
  }

  private recalculate(): void {
    let count = 0
    for (const email of this.emails.values()) {
      const firstMailbox = Object.keys(email.mailboxIds)[0]
      const mb = this.mailboxes.find((m) => m.id === firstMailbox)
      if (mb) {
        mb.totalEmails = mb.totalEmails ?? 0
        count++
      }
    }
    void count
    for (const mb of this.mailboxes) {
      mb.totalEmails = [...this.emails.values()].filter(
        (e) => e.mailboxIds[mb.id]
      ).length
      mb.unreadEmails = [...this.emails.values()].filter(
        (e) => e.mailboxIds[mb.id] && !e.keywords?.$seen
      ).length
      mb.totalThreads = new Set(
        [...this.emails.values()]
          .filter((e) => e.mailboxIds[mb.id])
          .map((e) => e.threadId)
      ).size
      mb.unreadThreads = new Set(
        [...this.emails.values()]
          .filter((e) => e.mailboxIds[mb.id] && !e.keywords?.$seen)
          .map((e) => e.threadId)
      ).size
    }
    this.track("Mailbox")
  }

  // -- Calendar ----------------------------------------------------------------

  private calendarGet(args: Record<string, unknown>) {
    return {
      accountId: String(args.accountId),
      state: this.state("Calendar"),
      list: this.calendars,
      notFound: [],
    }
  }

  private calendarSet(args: Record<string, unknown>) {
    const created: Record<string, { id: string }> = {}
    for (const [clientId, value] of Object.entries(
      (args.create ?? {}) as Record<string, { name: string; color?: string }>
    )) {
      const id = this.newId("cal")
      this.calendars.push({ id, name: value.name, color: value.color })
      created[clientId] = { id }
    }
    this.tick("Calendar")
    return {
      accountId: String(args.accountId),
      oldState: this.state("Calendar"),
      newState: this.state("Calendar"),
      created,
    }
  }

  private calendarEventQuery(args: Record<string, unknown>) {
    const filter = (args.filter ?? {}) as {
      after?: string
      before?: string
      inCalendar?: string
      uid?: string
      anyOf?: { uid?: string }[]
    }
    const list = [...this.events.values()].filter((ev) => {
      if (filter.inCalendar && ev.calendarId !== filter.inCalendar) return false
      if (filter.uid && ev.uid !== filter.uid) return false
      if (
        filter.anyOf?.length &&
        !filter.anyOf.some((condition) => condition.uid === ev.uid)
      )
        return false
      const t = intervalStart(ev.start)
      if (filter.after && t < filter.after && !filter.anyOf) return false
      if (filter.before && t >= filter.before) return false
      return true
    })
    list.sort((a, b) => (a.start > b.start ? 1 : -1))
    const position = Number(args.position ?? 0)
    const limit = typeof args.limit === "number" ? args.limit : list.length
    const ids = list.slice(position, position + limit).map((e) => e.id)
    return {
      accountId: String(args.accountId),
      queryState: this.state("CalendarEvent"),
      canCalculateChanges: true,
      position,
      ids,
      ...(args.calculateTotal ? { total: list.length } : {}),
    }
  }

  private calendarEventGet(args: Record<string, unknown>) {
    const ids = args.ids as JmapId[] | null | undefined
    const notFound: JmapId[] = []
    const list = [...this.events.values()].filter((ev) => {
      if (ids && !ids.includes(ev.id)) return false
      return true
    })
    if (ids) {
      const found = new Set(list.map((e) => e.id))
      for (const id of ids) if (!found.has(id)) notFound.push(id)
    }
    return {
      accountId: String(args.accountId),
      state: this.state("CalendarEvent"),
      list,
      notFound,
    }
  }

  private calendarEventSet(args: Record<string, unknown>) {
    const created: Record<string, Partial<CalendarEvent>> = {}
    const updated: Record<string, Partial<CalendarEvent> | null> = {}
    const destroyed: JmapId[] = []
    for (const [cid, patch] of Object.entries(
      (args.create as Record<string, Partial<CalendarEvent>> | undefined) ?? {}
    )) {
      const id = this.newId("evt")
      const createdEvent = {
        id,
        calendarId: patch.calendarId ?? "cal_personal",
        uid: patch.uid ?? this.newId("uid"),
        title: patch.title ?? "New event",
        start: patch.start ?? new Date().toISOString(),
        duration: patch.duration ?? "PT1H",
        ...(patch.description ? { description: patch.description } : {}),
        ...(patch.location ? { location: patch.location } : {}),
        ...(patch.freeBusyStatus
          ? { freeBusyStatus: patch.freeBusyStatus }
          : {}),
      } satisfies Partial<CalendarEvent>
      this.events.set(id, createdEvent as CalendarEvent)
      created[cid] = createdEvent
    }
    for (const [id, patch] of Object.entries(
      (args.update as Record<string, Record<string, unknown>> | undefined) ?? {}
    )) {
      const ev = this.events.get(id)
      if (!ev) continue
      Object.assign(ev, patch)
      ev.id = id
      updated[id] = ev
    }
    for (const id of (args.destroy as JmapId[] | undefined) ?? []) {
      if (this.events.delete(id)) destroyed.push(id)
    }
    const oldState = this.state("CalendarEvent")
    this.tick("CalendarEvent")
    this.track("CalendarEvent")
    return {
      accountId: String(args.accountId),
      oldState,
      newState: this.state("CalendarEvent"),
      ...(Object.keys(created).length ? { created } : {}),
      ...(Object.keys(updated).length ? { updated } : {}),
      ...(destroyed.length ? { destroyed } : {}),
    }
  }

  // -- Contacts -----------------------------------------------------------------

  private addressBookGet(args: Record<string, unknown>) {
    return {
      accountId: String(args.accountId),
      state: this.state("AddressBook"),
      list: this.addressBooks,
      notFound: [],
    }
  }

  private contactQuery(args: Record<string, unknown>) {
    const filter = (args.filter ?? {}) as {
      text?: string
      inAddressBook?: string
    }
    let list = [...this.contacts.values()]
    const inBook = filter.inAddressBook
    if (inBook) list = list.filter((c) => c.addressBookIds?.[inBook])
    if (filter.text) {
      const q = filter.text.toLowerCase()
      list = list.filter((c) => {
        const hay =
          `${c.fn ?? ""} ${c.n?.givenNames ?? ""} ${c.n?.familyName ?? ""} ${c.organization ?? ""} ${c.emails?.map((e) => e.value).join(" ") ?? ""}`.toLowerCase()
        return hay.includes(q)
      })
    }
    list.sort((a, b) => (a.fn ?? "").localeCompare(b.fn ?? ""))
    const ids = list.map((c) => c.id)
    return {
      accountId: String(args.accountId),
      queryState: this.state("Contact"),
      canCalculateChanges: true,
      position: 0,
      ids,
      ...(args.calculateTotal ? { total: ids.length } : {}),
    }
  }

  private contactGet(args: Record<string, unknown>) {
    const ids = args.ids as JmapId[] | null | undefined
    const notFound: JmapId[] = []
    const list = [...this.contacts.values()].filter(
      (c) => !ids || ids.includes(c.id)
    )
    if (ids) {
      const found = new Set(list.map((c) => c.id))
      for (const id of ids) if (!found.has(id)) notFound.push(id)
    }
    return {
      accountId: String(args.accountId),
      state: this.state("Contact"),
      list: list.map((contact) => this.toContactCard(contact)),
      notFound,
    }
  }

  private contactSet(args: Record<string, unknown>) {
    const created: Record<string, Partial<Contact>> = {}
    const updated: Record<string, Partial<Contact> | null> = {}
    const destroyed: JmapId[] = []
    for (const [cid, patch] of Object.entries(
      (args.create as Record<string, Partial<Contact>> | undefined) ?? {}
    )) {
      const id = this.newId("ct")
      const contact = contactFromJsContact({
        ...(patch as unknown as JsContactCard),
        id,
        addressBookIds: (patch as unknown as JsContactCard).addressBookIds ?? {
          ab_main: true,
        },
      })
      this.contacts.set(id, contact)
      created[cid] = contact
    }
    for (const [id, patch] of Object.entries(
      (args.update as Record<string, Record<string, unknown>> | undefined) ?? {}
    )) {
      const c = this.contacts.get(id)
      if (!c) continue
      const merged = contactFromJsContact({
        ...(this.toContactCard(c) as unknown as Record<string, unknown>),
        ...patch,
        id,
        addressBookIds: c.addressBookIds,
      } as JsContactCard)
      this.contacts.set(id, merged)
      updated[id] = merged
    }
    for (const id of (args.destroy as JmapId[] | undefined) ?? []) {
      if (this.contacts.delete(id)) destroyed.push(id)
    }
    const oldState = this.state("Contact")
    this.tick("Contact")
    this.track("Contact")
    return {
      accountId: String(args.accountId),
      oldState,
      newState: this.state("Contact"),
      ...(Object.keys(created).length ? { created } : {}),
      ...(Object.keys(updated).length ? { updated } : {}),
      ...(destroyed.length ? { destroyed } : {}),
    }
  }

  private toContactCard(contact: Contact): JsContactCard {
    return {
      ...(contactToJsContactCreate(contact) as unknown as JsContactCard),
      id: contact.id,
      addressBookIds: contact.addressBookIds ?? {},
    }
  }

  private contactGroupGet(args: Record<string, unknown>) {
    return {
      accountId: String(args.accountId),
      state: this.state("Contact"),
      list: this.groups,
      notFound: [],
    }
  }

  // -- Files ----------------------------------------------------------------------

  private fileNodeGet(args: Record<string, unknown>) {
    const ids = args.ids as JmapId[] | null | undefined
    const list = [...this.fileNodes.values()].filter(
      (f) => !ids || ids.includes(f.id)
    )
    const notFound: JmapId[] = []
    if (ids) {
      const found = new Set(list.map((f) => f.id))
      for (const id of ids) if (!found.has(id)) notFound.push(id)
    }
    return {
      accountId: String(args.accountId),
      state: this.state("FileNode"),
      list,
      notFound,
    }
  }

  private fileNodeSet(args: Record<string, unknown>) {
    const created: Record<string, Partial<FileNode>> = {}
    const updated: Record<string, Partial<FileNode> | null> = {}
    const destroyed: JmapId[] = []
    for (const [cid, patch] of Object.entries(
      (args.create as
        Record<string, Partial<FileNode> & { blobId?: string }> | undefined) ??
        {}
    )) {
      const id = newId()
      const isFile =
        patch.isFile ??
        (patch.nodeType != null ? patch.nodeType !== "directory" : true)
      const node: FileNode & { content?: string } = {
        id,
        name: patch.name ?? "untitled",
        isFile,
        nodeType: patch.nodeType ?? (isFile ? "file" : "directory"),
        contentType:
          patch.contentType ?? patch.type ?? "application/octet-stream",
        size: patch.size ?? 0,
        parentId: (patch.parentId as JmapId | null) ?? null,
        childNodeIds: [],
      }
      const blob = patch.blobId ? this.blobs.get(patch.blobId) : undefined
      if (blob) node.content = blob.content
      this.fileNodes.set(id, node)
      created[cid] = node
    }
    for (const [id, patch] of Object.entries(
      (args.update as Record<string, Record<string, unknown>> | undefined) ?? {}
    )) {
      const node = this.fileNodes.get(id)
      if (!node) continue
      Object.assign(node, patch)
      updated[id] = node
    }
    for (const id of (args.destroy as JmapId[] | undefined) ?? []) {
      if (this.fileNodes.delete(id)) destroyed.push(id)
    }
    const oldState = this.state("FileNode")
    this.tick("FileNode")
    this.track("FileNode")
    return {
      accountId: String(args.accountId),
      oldState,
      newState: this.state("FileNode"),
      ...(Object.keys(created).length ? { created } : {}),
      ...(Object.keys(updated).length ? { updated } : {}),
      ...(destroyed.length ? { destroyed } : {}),
    }
  }

  // -- blobs ----------------------------------------------------------------------

  hasBlob(blobId: string): boolean {
    return this.blobs.has(blobId)
  }

  getBlob(blobId: string): StoredBlob | undefined {
    return this.blobs.get(blobId)
  }

  addBlob(entry: Omit<StoredBlob, "blobId"> & { blobId: string }): void {
    this.blobs.set(entry.blobId, entry)
  }
}

// -- module helpers -----------------------------------------------------------

function newId(): string {
  return `fn_${Math.random().toString(36).slice(2, 8)}`
}

function H(value: JsonValue[]): JsonValue[] {
  return value
}

/** Extract preview from a create patch. */
function extractPreview(patch: Partial<StoredEmail>): string {
  const text = bodyContent(patch.textBody, patch.bodyValues) ?? ""
  return text.slice(0, 120) || (patch.subject as string | null) || ""
}

/**
 * Clients send bodies as part arrays + bodyValues; the mock stores plain
 * strings. Accepts either shape.
 */
function bodyContent(parts: unknown, bodyValues: unknown): string | undefined {
  if (typeof parts === "string") return parts
  if (Array.isArray(parts) && parts.length > 0 && bodyValues) {
    const partId = (parts[0] as { partId?: string })?.partId
    if (partId) {
      const entry = (bodyValues as Record<string, { value?: string }>)[partId]
      return entry?.value
    }
  }
  return undefined
}

function extractPreviewEmail(email: StoredEmail): string {
  return email.textBody?.slice(0, 120) ?? email.subject ?? ""
}

function normalizeMailboxIds(
  input: Record<string, boolean>,
  mailboxes: Mailbox[]
): Record<string, boolean> {
  const byRole = new Map<string, string>(
    mailboxes.map((m) => [(m.role ?? "") as string, m.id])
  )
  const out: Record<string, boolean> = {}
  for (const [key, value] of Object.entries(input)) {
    const resolved = byRole.get(key) ?? key
    out[resolved] = value
  }
  return out
}

function compareEmails(
  a: StoredEmail,
  b: StoredEmail,
  sort: EmailSortComparator[]
): number {
  for (const cmp of sort) {
    const dir = cmp.isAscending ? 1 : -1
    let av: string | number = ""
    let bv: string | number = ""
    switch (cmp.property) {
      case "receivedAt":
        av = a.receivedAt ?? ""
        bv = b.receivedAt ?? ""
        break
      case "sentAt":
        av = a.sentAt ?? ""
        bv = b.sentAt ?? ""
        break
      case "subject":
        av = a.subject ?? ""
        bv = b.subject ?? ""
        break
      case "from":
        av = a.from?.[0]?.email ?? ""
        bv = b.from?.[0]?.email ?? ""
        break
      case "to":
        av = a.to?.[0]?.email ?? ""
        bv = b.to?.[0]?.email ?? ""
        break
      case "size":
        av = a.size ?? 0
        bv = b.size ?? 0
        break
      default:
        continue
    }
    if (typeof av === "number" && typeof bv === "number") {
      if (av === bv) continue
      return (av < bv ? -1 : 1) * dir
    }
    const avs = String(av)
    const bvs = String(bv)
    if (avs === bvs) continue
    return (avs < bvs ? -1 : 1) * dir
  }
  return 0
}

/** Normalize an ISO instant for interval comparison. */
function intervalStart(value: string): string {
  return value
}

/**
 * Resolve a JSON-pointer-ish path against JMAP response args.
 *
 * Supported forms:
 *  - a literal path: "/id"
 *  - wildcard segments: "/list/<star>/id" or "/list/<star>/emailIds/<star>"
 *  - a created-client-id path: "/created/<clientId>/id"
 */
function resolvePath(root: Record<string, unknown>, path: string): unknown {
  const segments = path.replace(/^\//, "").split("/").filter(Boolean)
  let current: unknown = root
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    if (seg === "*") {
      if (!Array.isArray(current)) {
        throw new Error(`Cannot apply "*" to a non-array value at "${path}".`)
      }
      const rest = segments.slice(i + 1)
      if (rest.length === 0) return current
      const out: unknown[] = []
      for (const item of current) {
        let cursor: unknown = item
        for (const s of rest) {
          if (s === "*") {
            if (!Array.isArray(cursor)) continue
            const remaining = rest.slice(rest.indexOf(s) + 1)
            for (const sub of cursor) {
              if (remaining.length === 0) {
                out.push(sub)
              } else if (typeof sub === "object" && sub != null) {
                out.push(...flatten(sub as Record<string, unknown>, remaining))
              } else {
                out.push(sub)
              }
            }
            return out
          }
          if (typeof cursor === "object" && cursor != null) {
            cursor = (cursor as Record<string, unknown>)[s]
          } else {
            cursor = undefined
            break
          }
        }
        if (cursor !== undefined) out.push(cursor)
      }
      return out
    }
    if (typeof current === "object" && current != null) {
      current = (current as Record<string, unknown>)[seg]
    } else {
      current = undefined
      break
    }
  }
  return current
}

function flatten(obj: Record<string, unknown>, path: string[]): unknown[] {
  const out: unknown[] = []
  let current: unknown = obj
  for (const s of path) {
    if (s === "*") {
      if (Array.isArray(current))
        return current.flatMap((item) =>
          typeof item === "object" && item != null ? [item] : []
        )
      continue
    }
    if (typeof current === "object" && current != null) {
      current = (current as Record<string, unknown>)[s]
    } else {
      current = undefined
      break
    }
  }
  if (current !== undefined) out.push(current)
  return out
}

export type { StoredBlob }
