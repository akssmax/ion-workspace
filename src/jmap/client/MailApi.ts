/**
 * JMAP Mail namespace API. High level typed helpers layered over the raw
 * client so domain services never construct raw invocations themselves.
 */

import type { JmapClient } from "./JmapClient"
import type {
  DraftCreationInput,
  EmailFilterOperator,
  EmailGetResponse,
  EmailProperties,
  EmailQueryResponse,
  EmailSetResponse,
  EmailSortComparator,
  EmailSubmissionSetResponse,
  Identity,
  JmapId,
  Mailbox,
  MailboxRole,
  MailboxSetArgs,
  MailboxSetResponse,
  Thread,
} from "../types/mail"
import type { UploadedBlob } from "../types"
import { JMAP_CAPS } from "../types"

export interface EmailQueryOptions {
  filter?: EmailFilterOperator
  sort?: EmailSortComparator[]
  limit?: number | null
  position?: number
  anchor?: string
  anchorOffset?: number
  calculateTotal?: boolean
  collapseThreads?: boolean
  fetchThreads?: boolean
  properties?: string[]
  fetchTextBodyValues?: boolean
}

export interface MailboxQueryOptions {
  ids?: JmapId[] | null
  filter?: {
    parentId?: string | null
    name?: string
    hasAnyRole?: boolean
    role?: string
    isSubscribed?: boolean
  }
  properties?: string[]
}

export interface EmailListResult {
  mailboxes: Mailbox[]
  queryState: string
  position: number
  ids: JmapId[]
  total?: number
  emails: EmailProperties[]
  notFound: JmapId[]
  state: string
}

export interface SendEmailInput {
  identityId: string
  from: import("../types/mail").EmailAddress[]
  to: import("../types/mail").EmailAddress[]
  cc?: import("../types/mail").EmailAddress[]
  bcc?: import("../types/mail").EmailAddress[]
  subject?: string | null
  textBody?: string | null
  htmlBody?: string | null
  inReplyTo?: string[]
  references?: string[]
  draftId?: string | null
  attachments?: UploadedBlob[]
  mailboxIds?: Record<string, boolean>
  keywords?: Record<string, boolean>
}

const DEFAULT_EMAIL_PROPERTIES = [
  "blobId",
  "threadId",
  "mailboxIds",
  "keywords",
  "from",
  "to",
  "cc",
  "bcc",
  "subject",
  "sentAt",
  "receivedAt",
  "preview",
  "size",
  "hasAttachment",
  "inReplyTo",
  "references",
  "messageId",
  "headers",
  "textBody",
  "htmlBody",
  "attachments",
  "bodyValues",
]

export class MailApi {
  private _accountId: string | null = null
  private roleCache = new Map<string, Mailbox | null>()

  constructor(private readonly client: JmapClient) {}

  get accountId(): string | null {
    return this._accountId
  }

  bindAccount(accountId: string): void {
    if (this._accountId !== accountId) {
      this._accountId = accountId
      this.roleCache.clear()
    }
  }

  private acct(accountId?: string): string {
    return accountId ?? this._accountId ?? ""
  }

  private checkAccount(): void {
    if (!this._accountId) {
      throw new Error("The JMAP mail namespace is not bound to an account.")
    }
  }

  /**
   * Load all mailboxes for the bound (or explicit) account.
   */
  async getMailboxes(accountId?: string): Promise<Mailbox[]> {
    const res = await this.client.call<{ list: Mailbox[] }>(
      "Mailbox/get",
      { accountId: this.acct(accountId) },
      "mb0"
    )
    return res.list
  }

  /**
   * Mailbox/get with full options.
   */
  async mailboxes(
    options: MailboxQueryOptions = {},
    accountId?: string
  ): Promise<{ mailboxes: Mailbox[]; notFound: JmapId[]; state: string }> {
    const res = await this.client.call<{
      list: Mailbox[]
      notFound: JmapId[]
      state: string
    }>(
      "Mailbox/get",
      {
        accountId: this.acct(accountId),
        ids: options.ids ?? null,
        properties: options.properties ?? [],
        ...(options.filter ? { filter: options.filter } : {}),
      },
      "mbbox"
    )
    return { mailboxes: res.list, notFound: res.notFound, state: res.state }
  }

  /**
   * Mailbox/set: create, rename/move and delete mailboxes.
   */
  async setMailboxes(
    args: MailboxSetArgs,
    accountId?: string
  ): Promise<MailboxSetResponse> {
    this.checkAccount()
    return this.client.call<MailboxSetResponse>(
      "Mailbox/set",
      {
        accountId: this.acct(accountId),
        ...(args.create ? { create: args.create } : {}),
        ...(args.update ? { update: args.update } : {}),
        ...(args.destroy ? { destroy: args.destroy } : {}),
      },
      "mbs0"
    )
  }

  /**
   * Find the mailbox with the given role (cached per account).
   */
  async findRoleMailbox(
    role: MailboxRole,
    accountId?: string
  ): Promise<Mailbox | null> {
    if (this.roleCache.has(role)) return this.roleCache.get(role) ?? null
    const mailboxes = await this.getMailboxes(accountId)
    const found = mailboxes.find((m) => m.role === role) ?? null
    this.roleCache.set(role, found)
    return found
  }

  async mustRoleMailbox(
    role: MailboxRole,
    accountId?: string
  ): Promise<Mailbox> {
    const mailbox = await this.findRoleMailbox(role, accountId)
    if (!mailbox) {
      throw new Error(`No ${role} mailbox configured for this account.`)
    }
    return mailbox
  }

  /**
   * Query email ids for a mailbox/filter (collapsed into threads by default).
   */
  async queryEmails(
    mailboxId: string,
    options: EmailQueryOptions = {},
    accountId?: string
  ): Promise<
    Pick<EmailQueryResponse, "queryState" | "ids" | "position" | "total">
  > {
    const res = await this.client.call<EmailQueryResponse>(
      "Email/query",
      {
        accountId: this.acct(accountId),
        filter: options.filter ?? { inMailbox: mailboxId },
        sort: options.sort ?? [{ property: "receivedAt", isAscending: false }],
        position: options.position,
        limit: options.limit ?? null,
        calculateTotal: options.calculateTotal,
        collapseThreads: options.collapseThreads ?? true,
      },
      "eq0"
    )
    return {
      queryState: res.queryState,
      ids: res.ids,
      position: res.position,
      total: res.total,
    }
  }

  /**
   * Query + fetch emails in a single batched request (the common inbox
   * list path).
   */
  async getEmails(
    mailboxId: string,
    options: EmailQueryOptions = {},
    accountId?: string
  ): Promise<EmailListResult> {
    this.checkAccount()
    const acc = this.acct(accountId)
    const qid = "eq1"
    const gid = "eg1"

    const res = await this.client.invoke(
      [
        {
          id: qid,
          method: "Email/query",
          args: {
            accountId: acc,
            filter: options.filter ?? { inMailbox: mailboxId },
            sort: options.sort ?? [
              { property: "receivedAt", isAscending: false },
            ],
            position: options.position,
            limit: options.limit ?? null,
            calculateTotal: options.calculateTotal,
            collapseThreads: options.collapseThreads ?? true,
          },
        },
        {
          id: gid,
          method: "Email/get",
          args: {
            accountId: acc,
            ids: [`#${qid}`],
            properties: options.properties ?? [
              "threadId",
              "mailboxIds",
              "keywords",
              "from",
              "to",
              "cc",
              "subject",
              "sentAt",
              "receivedAt",
              "preview",
              "size",
              "hasAttachment",
            ],
            fetchTextBodyValues: options.fetchTextBodyValues,
          },
          resultOf: { callId: qid, name: "Email/query", path: "/ids/*" },
        },
      ],
      { accountId: acc }
    )

    const query = res.get<EmailQueryResponse>(qid)
    const get = res.get<EmailGetResponse>(gid)
    // Email/get does not promise query order; render in Email/query order.
    const byId = new Map(get.list.map(email => [email.id, email]))
    return {
      mailboxes: [],
      queryState: query.queryState,
      position: query.position,
      ids: query.ids,
      total: query.total,
      emails: query.ids.map(id => byId.get(id)).filter((email): email is EmailProperties => !!email),
      notFound: get.notFound,
      state: get.state,
    }
  }

  /**
   * Get full email objects (with body values where requested).
   */
  async getEmailByIds(
    ids: JmapId[],
    options: {
      fetchTextBodyValues?: boolean
      fetchHTMLBodyValues?: boolean
      maxBodyValueBytes?: number
      properties?: string[]
    } = {},
    accountId?: string
  ): Promise<EmailProperties[]> {
    const res = await this.client.call<EmailGetResponse>(
      "Email/get",
      {
        accountId: this.acct(accountId),
        ids,
        properties: options.properties ?? DEFAULT_EMAIL_PROPERTIES,
        fetchTextBodyValues: options.fetchTextBodyValues,
        fetchHTMLBodyValues: options.fetchHTMLBodyValues,
        maxBodyValueBytes: options.maxBodyValueBytes ?? 1_000_000,
      },
      "email"
    )
    return res.list
  }

  /**
   * Fetch multiple threads in one call.
   */
  async getThreads(threadIds: JmapId[], accountId?: string): Promise<Thread[]> {
    if (threadIds.length === 0) return []
    const res = await this.client.call<{ list: Thread[] }>(
      "Thread/get",
      { accountId: this.acct(accountId), ids: [...new Set(threadIds)] },
      "tgall"
    )
    return res.list
  }

  /**
   * Fetch an entire thread (Thread/get + Email/get in one batch).
   */
  async getThread(
    threadId: JmapId,
    options: {
      fetchTextBodyValues?: boolean
      fetchHTMLBodyValues?: boolean
    } = {},
    accountId?: string
  ): Promise<{ thread: Thread; emails: EmailProperties[] }> {
    this.checkAccount()
    const acc = this.acct(accountId)
    const tid = "tg0"
    const eid = "te0"

    const res = await this.client.invoke(
      [
        {
          id: tid,
          method: "Thread/get",
          args: { accountId: acc, ids: [threadId] },
        },
        {
          id: eid,
          method: "Email/get",
          args: {
            accountId: acc,
            ids: [`#${tid}`],
            properties: DEFAULT_EMAIL_PROPERTIES,
            fetchTextBodyValues: options.fetchTextBodyValues,
            fetchHTMLBodyValues: options.fetchHTMLBodyValues,
            maxBodyValueBytes: 1_000_000,
          },
          resultOf: {
            callId: tid,
            name: "Thread/get",
            path: "/list/*/emailIds/*",
          },
        },
      ],
      { accountId: acc }
    )

    const threadRes = res.get<{ list: Thread[]; notFound: JmapId[] }>(tid)
    const emailsRes = res.get<EmailGetResponse>(eid)
    const thread = threadRes.list.find((t) => t.id === threadId) ?? {
      id: threadId,
      emailIds: [],
    }
    return { thread, emails: emailsRes.list }
  }

  /**
   * Resolve the mailbox to store drafts for this account (role "drafts").
   */
  async draftsMailboxId(accountId?: string): Promise<string> {
    const mailbox = await this.findRoleMailbox("drafts", accountId)
    return mailbox?.id ?? "drafts"
  }

  /**
   * Resolve role-based mailbox refs (e.g. { sent: true }) into actual ids.
   */
  private async resolveMailboxIds(
    refs: Record<string, boolean> | undefined,
    fallback: Record<string, boolean>
  ): Promise<Record<string, boolean>> {
    const input = refs ?? fallback
    const out: Record<string, boolean> = {}
    const byRole = new Map(this.roleCache)
    if (byRole.size === 0) {
      const mailboxes = await this.getMailboxes()
      for (const m of mailboxes) byRole.set(m.role ?? "", m)
    }
    for (const [key, value] of Object.entries(input)) {
      const mailbox =
        key.startsWith("mbox") || !key ? undefined : byRole.get(key)
      out[mailbox?.id ?? key] = value
    }
    return out
  }

  /**
   * Create (or update) a draft email.
   * When `draftEmailId` is provided it updates that email instead.
   */
  async saveDraft(
    input: DraftCreationInput,
    options: { draftEmailId?: string | null } = {},
    accountId?: string
  ): Promise<string> {
    this.checkAccount()
    const acc = this.acct(accountId)
    const mailboxIds = await this.resolveMailboxIds(input.mailboxIds, {
      drafts: true,
    })
    const buildCreate = () => {
      const create: Record<string, unknown> = {
        mailboxIds,
        keywords: input.keywords ?? { $draft: true },
        ...(input.subject != null ? { subject: input.subject } : {}),
        ...(input.to ? { to: input.to } : {}),
        ...(input.cc ? { cc: input.cc } : {}),
        ...(input.bcc ? { bcc: input.bcc } : {}),
        ...(input.from ? { from: input.from } : {}),
        ...(input.inReplyTo?.length ? { inReplyTo: input.inReplyTo } : {}),
        ...(input.references?.length ? { references: input.references } : {}),
      }
      if (input.textBody != null) {
        create.textBody = [{ type: "text/plain", partId: "1", blobId: null }]
        create.bodyValues = { "1": { value: input.textBody } }
      }
      if (input.htmlBody != null) {
        // Distinct partId from the text body — sharing "1" would clobber it.
        create.htmlBody = [{ type: "text/html", partId: "2", blobId: null }]
        create.bodyValues = {
          ...(create.bodyValues as Record<string, unknown> | undefined),
          "2": { value: input.htmlBody },
        }
      }
      if (input.attachments?.length) {
        create.attachments = input.attachments.map((a, i) => ({
          blobId: a.blobId,
          name: a.name,
          type: a.type,
          partId: `a${i}`,
        }))
      }
      return create
    }

    if (options.draftEmailId) {
      await this.client.call<EmailSetResponse>(
        "Email/set",
        { accountId: acc, update: { [options.draftEmailId]: buildCreate() } },
        "esdraft"
      )
      return options.draftEmailId
    }

    const res = await this.client.call<EmailSetResponse>(
      "Email/set",
      { accountId: acc, create: { draft: buildCreate() } },
      "esdraft"
    )
    const emailId = res.created?.draft?.id
    if (!emailId) {
      throw new Error("Draft creation failed.")
    }
    return emailId
  }

  /**
   * Send an email. Creates the Email + EmailSubmission in one batched
   * request. Returns the submission id.
   */
  async sendEmail(input: SendEmailInput, accountId?: string): Promise<string> {
    this.checkAccount()
    const acc = this.acct(accountId)

    const emailCreate: Record<string, unknown> = {
      mailboxIds: await this.resolveMailboxIds(input.mailboxIds, {
        sent: true,
      }),
      keywords: input.keywords ?? {},
      from: input.from,
      ...(input.to.length ? { to: input.to } : {}),
      ...(input.cc?.length ? { cc: input.cc } : {}),
      ...(input.bcc?.length ? { bcc: input.bcc } : {}),
      ...(input.subject != null ? { subject: input.subject } : {}),
      ...(input.inReplyTo?.length ? { inReplyTo: input.inReplyTo } : {}),
      ...(input.references?.length ? { references: input.references } : {}),
    }

    if (input.htmlBody != null) {
      emailCreate.htmlBody = [{ type: "text/html", partId: "2", blobId: null }]
      emailCreate.bodyValues = { "2": { value: input.htmlBody } }
    }
    if (input.textBody != null) {
      emailCreate.textBody = [{ type: "text/plain", partId: "1", blobId: null }]
      emailCreate.bodyValues = {
        ...(emailCreate.bodyValues as Record<string, unknown> | undefined),
        "1": { value: input.textBody },
      }
    }
    if (input.attachments?.length) {
      emailCreate.attachments = input.attachments.map((a, i) => ({
        blobId: a.blobId,
        name: a.name,
        type: a.type,
        partId: `a${i}`,
      }))
    }

    // Create the message first, then submit by its concrete id. Stalwart (and
    // some other servers) reject a result reference (`#emailId`) for the
    // single-value `emailId` property of EmailSubmission/set, so a single
    // batched request fails with `invalidProperties: ["#emailId"]`.
    const setRes = await this.client.call<EmailSetResponse>(
      "Email/set",
      { accountId: acc, create: { send: emailCreate } },
      "sendEmail"
    )
    if (setRes.notCreated?.send) {
      const failure = setRes.notCreated.send
      throw new Error(
        `Could not create the message: ${failure.description ?? failure.type}`
      )
    }
    const emailId = setRes.created?.send?.id
    if (!emailId) throw new Error("Email creation failed.")

    const subRes = await this.client.call<EmailSubmissionSetResponse>(
      "EmailSubmission/set",
      {
        accountId: acc,
        create: {
          send: {
            identityId: input.identityId,
            emailId,
            envelope: {
              mailFrom: input.from[0]
                ? { email: input.from[0].email }
                : { email: "" },
              rcptTo: [
                ...(input.to ?? []),
                ...(input.cc ?? []),
                ...(input.bcc ?? []),
              ].map((a) => ({
                email: a.email,
              })),
            },
          },
        },
        onSuccessUpdateEmail: { send: { "keywords/$sent": true } },
      },
      "sendSub"
    )

    if (subRes.notCreated?.send) {
      // Submission failed: don't leave the unsent copy behind.
      try {
        await this.destroyEmails([emailId], acc)
      } catch {
        // best effort
      }
      const failure = subRes.notCreated.send
      throw new Error(
        `Email submission failed: ${failure.description ?? failure.type}`
      )
    }
    const created = subRes.created?.send
    if (!created?.id) throw new Error("Email submission failed.")
    return created.id
  }

  /**
   * Update keyword/mailbox flags on one or more emails.
   */
  async updateEmails(
    updates: Record<string, Record<string, unknown>>,
    accountId?: string
  ): Promise<void> {
    this.checkAccount()
    const acc = this.acct(accountId)
    const result = await this.client.call<EmailSetResponse>(
      "Email/set",
      { accountId: acc, update: updates },
      "eupd"
    )
    const error = Object.entries(result.notUpdated ?? {})[0]
    if (error)
      throw new Error(
        `Could not update email ${error[0]}: ${error[1].description ?? error[1].type}`
      )
  }

  async setKeywords(
    ids: JmapId[],
    keywordsToSet: Record<string, boolean>,
    accountId?: string
  ): Promise<void> {
    if (ids.length === 0) return
    // Patch syntax ("keywords/$seen": true) so unrelated keywords survive.
    const update: Record<string, Record<string, unknown>> = {}
    for (const id of ids) {
      const patch: Record<string, unknown> = {}
      for (const [kw, value] of Object.entries(keywordsToSet)) {
        patch[`keywords/${kw}`] = value ? true : null
      }
      update[id] = patch
    }
    await this.updateEmails(update, accountId)
  }

  /**
   * Add or remove a label (mailbox) on emails without disturbing their
   * other mailbox memberships — JMAP multi-mailbox semantics.
   */
  async applyLabel(
    ids: JmapId[],
    labelId: JmapId,
    applied: boolean,
    accountId?: string
  ): Promise<void> {
    this.checkAccount()
    if (ids.length === 0) return
    const update: Record<string, Record<string, unknown>> = {}
    for (const id of ids) {
      update[id] = { [`mailboxIds/${labelId}`]: applied ? true : null }
    }
    await this.updateEmails(update, accountId)
  }

  /** Move the primary location while retaining unrelated label memberships. */
  async moveEmails(
    ids: JmapId[],
    toMailboxId: string,
    accountId?: string,
    fromMailboxId?: string
  ): Promise<void> {
    this.checkAccount()
    if (ids.length === 0) return
    const [mailboxes, emails] = await Promise.all([
      this.getMailboxes(accountId),
      this.getEmailByIds(ids, { properties: ["id", "mailboxIds"] }, accountId),
    ])
    const target = mailboxes.find((mailbox) => mailbox.id === toMailboxId)
    if (!target) throw new Error("Destination mailbox no longer exists.")
    const primaryRoles = new Set([
      "inbox",
      "archive",
      "sent",
      "drafts",
      "trash",
      "junk",
    ])
    const update: Record<string, Record<string, unknown>> = {}
    for (const email of emails) {
      const patch: Record<string, unknown> = {
        [`mailboxIds/${toMailboxId}`]: true,
      }
      for (const mailbox of mailboxes) {
        if (mailbox.id === toMailboxId || !email.mailboxIds?.[mailbox.id])
          continue
        if (
          primaryRoles.has(mailbox.role ?? "") ||
          mailbox.id === fromMailboxId
        ) {
          patch[`mailboxIds/${mailbox.id}`] = null
        }
      }
      update[email.id] = patch
    }
    if (emails.length !== new Set(ids).size)
      throw new Error("Some messages no longer exist.")
    await this.updateEmails(update, accountId)
  }

  async markRead(
    ids: JmapId[],
    read = true,
    accountId?: string
  ): Promise<void> {
    await this.setKeywords(ids, { $seen: read }, accountId)
  }

  async markStarred(
    ids: JmapId[],
    starred = true,
    accountId?: string
  ): Promise<void> {
    await this.setKeywords(ids, { $flagged: starred }, accountId)
  }

  async archive(ids: JmapId[], accountId?: string): Promise<void> {
    const mailbox = await this.findRoleMailbox("archive", accountId)
    if (!mailbox) throw new Error("Archive mailbox is unavailable.")
    await this.moveEmails(ids, mailbox.id, accountId)
  }

  async unarchive(ids: JmapId[], accountId?: string): Promise<void> {
    const inbox = await this.findRoleMailbox("inbox", accountId)
    if (!inbox) throw new Error("Inbox mailbox is unavailable.")
    await this.moveEmails(ids, inbox.id, accountId)
  }

  async trash(ids: JmapId[], accountId?: string): Promise<void> {
    const mailbox = await this.findRoleMailbox("trash", accountId)
    if (!mailbox) throw new Error("Trash mailbox is unavailable.")
    await this.moveEmails(ids, mailbox.id, accountId)
  }

  async reportJunk(
    ids: JmapId[],
    phishing = false,
    accountId?: string
  ): Promise<void> {
    const junk = await this.findRoleMailbox("junk", accountId)
    if (!junk) throw new Error("Spam mailbox is unavailable.")
    await this.moveEmails(ids, junk.id, accountId)
    await this.setKeywords(ids, { $junk: true, $phishing: phishing }, accountId)
  }

  async markNotJunk(ids: JmapId[], accountId?: string): Promise<void> {
    const inbox = await this.findRoleMailbox("inbox", accountId)
    if (!inbox) throw new Error("Inbox mailbox is unavailable.")
    await this.moveEmails(ids, inbox.id, accountId)
    await this.setKeywords(ids, { $junk: false, $phishing: false }, accountId)
  }

  async destroyEmails(ids: JmapId[], accountId?: string): Promise<void> {
    if (!ids.length) return
    const result = await this.client.call<EmailSetResponse>(
      "Email/set",
      { accountId: this.acct(accountId), destroy: ids },
      "edestroy"
    )
    const error = Object.entries(result.notDestroyed ?? {})[0]
    if (error)
      throw new Error(
        `Could not delete email ${error[0]}: ${error[1].description ?? error[1].type}`
      )
  }

  /**
   * Fetch sender identities.
   */
  async getIdentities(accountId?: string): Promise<Identity[]> {
    const res = await this.client.call<{ list: Identity[] }>(
      "Identity/get",
      { accountId: this.acct(accountId) },
      "id0"
    )
    return res.list
  }

  async updateIdentity(id: string, patch: Partial<Pick<Identity, "name" | "replyTo" | "bcc" | "textSignature" | "htmlSignature">>, accountId?: string): Promise<void> {
    const result = await this.client.call<{ notUpdated?: Record<string, { description?: string; type: string }> }>(
      "Identity/set", { accountId: this.acct(accountId), update: { [id]: patch } }, "id1"
    )
    const failure = result.notUpdated?.[id]
    if (failure) throw new Error(failure.description ?? failure.type)
  }

  /**
   * Max object/size caps from the core capability.
   */
  async capabilities(): Promise<{ mail: Record<string, unknown> }> {
    const session = await this.client.session()
    const mailCaps = (session.capabilities[JMAP_CAPS.MAIL] ?? {}) as Record<
      string,
      unknown
    >
    return { mail: mailCaps }
  }
}

export type {
  EmailProperties as MailEmail,
  Thread as MailThread,
  Identity as MailIdentity,
  Mailbox as MailboxDto,
  UploadedBlob as MailUploadedBlob,
}
export type {
  DraftCreationInput as MailDraftInput,
  EmailBodyPart as MailBodyPart,
} from "../types/mail"
export type { MailboxRole as MailboxRoleDto } from "../types/mail"
