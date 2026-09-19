/**
 * Mail domain service.
 *
 * The component layer never touches the JMAP client directly: it calls
 * functions here (via TanStack Query hooks) and everything else is JMAP
 * protocol detail.
 */

import type {
  EmailProperties,
  Identity,
  JmapId,
  Mailbox,
  MailboxSetArgs,
  MailboxSetResponse,
  Thread,
} from "../../jmap/types/mail"
import type { UploadedBlob } from "../../jmap/types"
import { AppError, toAppError } from "../../jmap/types/error"
import { getJmapClient, getPrimaryAccountId } from "../jmap.service"
import type { EmailQueryOptions } from "../../jmap/client/MailApi"
import type { EmailListResult } from "../../jmap/client/MailApi"

export interface SendDraftInput {
  identityId: string
  from: { name?: string; email: string }[]
  to: { name?: string; email: string }[]
  cc?: { name?: string; email: string }[]
  bcc?: { name?: string; email: string }[]
  subject?: string | null
  textBody?: string | null
  htmlBody?: string | null
  inReplyTo?: string[]
  references?: string[]
  attachments?: UploadedBlob[]
  draftId?: string | null
}

export async function getMailboxes(): Promise<Mailbox[]> {
  try {
    const client = await getJmapClient()
    const accountId = await getPrimaryAccountId()
    if (!accountId)
      throw new AppError("accountNotFound", "No primary mail account found.")
    client.mail.bindAccount(accountId)
    return client.mail.getMailboxes(accountId)
  } catch (error) {
    throw toAppError(error)
  }
}

export async function setMailboxes(
  args: MailboxSetArgs
): Promise<MailboxSetResponse> {
  try {
    const client = await getJmapClient()
    const accountId = await getPrimaryAccountId()
    if (!accountId)
      throw new AppError("accountNotFound", "No primary mail account found.")
    client.mail.bindAccount(accountId)
    return client.mail.setMailboxes(args, accountId)
  } catch (error) {
    throw toAppError(error)
  }
}

export async function getEmails(
  mailboxId: JmapId,
  options: EmailQueryOptions = {}
): Promise<EmailListResult> {
  try {
    const client = await getJmapClient()
    const accountId = await getPrimaryAccountId()
    if (!accountId)
      throw new AppError("accountNotFound", "No primary mail account found.")
    client.mail.bindAccount(accountId)
    return client.mail.getEmails(mailboxId, options, accountId)
  } catch (error) {
    throw toAppError(error)
  }
}

export async function getThread(
  threadId: JmapId
): Promise<{ thread: Thread; emails: EmailProperties[] }> {
  try {
    const client = await getJmapClient()
    const accountId = await getPrimaryAccountId()
    if (!accountId)
      throw new AppError("accountNotFound", "No primary mail account found.")
    client.mail.bindAccount(accountId)
    return client.mail.getThread(
      threadId,
      { fetchTextBodyValues: true, fetchHTMLBodyValues: true },
      accountId
    )
  } catch (error) {
    throw toAppError(error)
  }
}

export async function getThreads(threadIds: JmapId[]): Promise<Thread[]> {
  try {
    const client = await getJmapClient()
    const accountId = await getPrimaryAccountId()
    if (!accountId) return []
    client.mail.bindAccount(accountId)
    return client.mail.getThreads(threadIds, accountId)
  } catch (error) {
    throw toAppError(error)
  }
}

export async function getEmailById(
  id: JmapId
): Promise<EmailProperties | null> {
  try {
    const client = await getJmapClient()
    const accountId = await getPrimaryAccountId()
    if (!accountId) return null
    client.mail.bindAccount(accountId)
    const emails = await client.mail.getEmailByIds(
      [id],
      { fetchTextBodyValues: true, fetchHTMLBodyValues: true },
      accountId
    )
    return emails[0] ?? null
  } catch (error) {
    throw toAppError(error)
  }
}

export async function getEmailsByIds(
  ids: JmapId[],
  properties?: string[]
): Promise<EmailProperties[]> {
  try {
    const client = await getJmapClient()
    const accountId = await getPrimaryAccountId()
    if (!accountId) return []
    client.mail.bindAccount(accountId)
    return client.mail.getEmailByIds(ids, { properties }, accountId)
  } catch (error) {
    throw toAppError(error)
  }
}

export async function getIdentities(): Promise<Identity[]> {
  try {
    const client = await getJmapClient()
    const accountId = await getPrimaryAccountId()
    if (!accountId) return []
    client.mail.bindAccount(accountId)
    return client.mail.getIdentities(accountId)
  } catch (error) {
    throw toAppError(error)
  }
}

/**
 * UI selection works in thread ids; Email/set works in email ids. Resolve
 * thread ids to their member email ids, passing through anything that is
 * not a thread id.
 */
async function resolveEmailIds(ids: JmapId[]): Promise<JmapId[]> {
  if (ids.length === 0) return []
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId()
  if (!accountId) return ids
  client.mail.bindAccount(accountId)
  const threads = (await client.mail.getThreads(ids, accountId)).filter(
    (t): t is Thread => !!t
  )
  const byThread = new Map(threads.map((t) => [t.id, t.emailIds]))
  const out: JmapId[] = []
  for (const id of ids) {
    const memberIds = byThread.get(id)
    if (memberIds?.length) out.push(...memberIds)
    else out.push(id)
  }
  return [...new Set(out)]
}

export async function markRead(ids: JmapId[], read: boolean): Promise<void> {
  const client = await getJmapClient()
  await client.mail.markRead(await resolveEmailIds(ids), read)
}

export async function markStarred(
  ids: JmapId[],
  starred: boolean
): Promise<void> {
  const client = await getJmapClient()
  await client.mail.markStarred(await resolveEmailIds(ids), starred)
}

export async function archiveEmails(ids: JmapId[]): Promise<void> {
  const client = await getJmapClient()
  await client.mail.archive(await resolveEmailIds(ids))
}

export async function moveEmails(
  ids: JmapId[],
  toMailboxId: JmapId
): Promise<void> {
  const client = await getJmapClient()
  await client.mail.moveEmails(await resolveEmailIds(ids), toMailboxId)
}

export async function trashEmails(ids: JmapId[]): Promise<void> {
  const client = await getJmapClient()
  await client.mail.trash(await resolveEmailIds(ids))
}

export async function restoreEmails(ids: JmapId[]): Promise<void> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId()
  if (!accountId) return
  const inbox = await client.mail.findRoleMailbox("inbox", accountId)
  if (!inbox) return
  await client.mail.moveEmails(await resolveEmailIds(ids), inbox.id)
}

/**
 * Apply or remove a label (a role-less mailbox) on the given threads/emails,
 * preserving all other mailbox memberships.
 */
export async function applyLabel(
  ids: JmapId[],
  labelId: JmapId,
  applied: boolean
): Promise<void> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId()
  if (!accountId) return
  client.mail.bindAccount(accountId)
  await client.mail.applyLabel(await resolveEmailIds(ids), labelId, applied, accountId)
}

export async function sendDraft(input: SendDraftInput): Promise<string> {
  try {
    const client = await getJmapClient()
    const accountId = await getPrimaryAccountId()
    if (!accountId)
      throw new AppError("accountNotFound", "No primary mail account found.")
    const submissionId = await client.mail.sendEmail(
      {
        identityId: input.identityId,
        from: input.from,
        to: input.to,
        cc: input.cc,
        bcc: input.bcc,
        subject: input.subject,
        textBody: input.textBody,
        htmlBody: input.htmlBody,
        inReplyTo: input.inReplyTo,
        references: input.references,
        attachments: input.attachments,
      },
      accountId
    )
    // Remove the stored draft so it doesn't linger next to the sent copy.
    if (input.draftId) {
      try {
        await client.mail.updateEmails(
          { [input.draftId]: { mailboxIds: { trash: true } } },
          accountId
        )
      } catch {
        // best effort cleanup
      }
    }
    return submissionId
  } catch (error) {
    throw toAppError(error)
  }
}

export async function saveDraft(input: {
  draftEmailId?: string | null
  mailboxIds?: Record<string, boolean>
  to?: { name?: string; email: string }[]
  cc?: { name?: string; email: string }[]
  bcc?: { name?: string; email: string }[]
  from?: { name?: string; email: string }[]
  subject?: string | null
  textBody?: string | null
  htmlBody?: string | null
  attachments?: UploadedBlob[]
}): Promise<string> {
  try {
    const client = await getJmapClient()
    const accountId = await getPrimaryAccountId()
    if (!accountId)
      throw new AppError("accountNotFound", "No primary mail account found.")
    return client.mail.saveDraft(
      {
        mailboxIds: input.mailboxIds,
        to: input.to,
        cc: input.cc,
        bcc: input.bcc,
        from: input.from,
        subject: input.subject,
        textBody: input.textBody ?? undefined,
        htmlBody: input.htmlBody ?? undefined,
        attachments: input.attachments,
      },
      { draftEmailId: input.draftEmailId },
      accountId
    )
  } catch (error) {
    throw toAppError(error)
  }
}

/**
 * Upload a file as an attachment blob.
 */
export async function uploadAttachment(file: File): Promise<UploadedBlob> {
  try {
    const client = await getJmapClient()
    const accountId = await getPrimaryAccountId()
    if (!accountId)
      throw new AppError("accountNotFound", "No primary mail account found.")
    const content = await file.arrayBuffer()
    return client.upload(accountId, content, {
      contentType: file.type || "application/octet-stream",
      filename: file.name,
    })
  } catch (error) {
    throw toAppError(error)
  }
}

export async function downloadAttachment(blobId: JmapId): Promise<Blob> {
  try {
    const client = await getJmapClient()
    const accountId = await getPrimaryAccountId()
    if (!accountId)
      throw new AppError("accountNotFound", "No primary mail account found.")
    return client.download(accountId, blobId)
  } catch (error) {
    throw toAppError(error)
  }
}

export type { EmailQueryOptions as MailQueryOptions }
