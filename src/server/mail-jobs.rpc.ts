import { createServerFn } from "@tanstack/react-start"
import { requireSession } from "./session.server"
import type { SendDraftInput } from "@/services/mail/mail.service"
import { cancelJob, listJobs, mailJobsAvailable, queueJob, retryJob, workerClient } from "./mail-jobs.server"
import { activeStalwartToken } from "./stalwart-auth.server"

export const getMailJobsCapability = createServerFn({ method: "GET" }).handler(async () => {
  let session = await requireSession()
  if (!(await mailJobsAvailable(session))) return false
  try {
    await activeStalwartToken()
    session = await requireSession()
    const { accountId } = await workerClient({ accessToken: session.accessToken!, refreshToken: session.refreshToken!, expiresAt: session.accessTokenExpiresAt ?? 0 })
    return accountId === session.accountId
  } catch { return false }
})
export const getMailJobs = createServerFn({ method: "GET" }).handler(async () => listJobs(await requireSession()))

export const queueMailSend = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { input: SendDraftInput; requestId: string; scheduledFor?: string })
  .handler(async ({ data }) => {
    let session = await requireSession()
    if (!(await mailJobsAvailable(session))) throw new Error("Scheduled mail is unavailable for this account.")
    await activeStalwartToken()
    session = await requireSession()
    const { accountId } = await workerClient({ accessToken: session.accessToken!, refreshToken: session.refreshToken!, expiresAt: session.accessTokenExpiresAt ?? 0 })
    if (accountId !== session.accountId) throw new Error("Your mail account changed; sign in again.")
    const input = data.input
    if (!input || typeof input.identityId !== "string" || !input.from?.[0]?.email || !Array.isArray(input.to) || !input.to.length || !input.to.every(address => typeof address.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) || ![...(input.cc ?? []), ...(input.bcc ?? [])].every(address => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email))) throw new Error("Check the sending identity and recipient addresses.")
    const runAt = data.scheduledFor ? new Date(data.scheduledFor) : new Date(Date.now() + 10_000)
    if (!Number.isFinite(runAt.getTime())) throw new Error("Choose a valid send time.")
    return queueJob(session, "send", { input }, runAt, data.requestId)
  })

export const queueMailSnooze = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { threadIds: string[]; wakeAt: string; requestId: string })
  .handler(async ({ data }) => {
    let session = await requireSession()
    if (!(await mailJobsAvailable(session))) throw new Error("Snooze requires scheduled mail storage and a real mail account.")
    await activeStalwartToken()
    session = await requireSession()
    if (!Array.isArray(data.threadIds) || data.threadIds.length < 1 || data.threadIds.length > 100 || data.threadIds.some(id => typeof id !== "string" || !id || id.length > 250)) throw new Error("Choose up to 100 conversations.")
    const wakeAt = new Date(data.wakeAt)
    if (!Number.isFinite(wakeAt.getTime())) throw new Error("Choose a valid wake time.")
    const { client, accountId } = await workerClient({ accessToken: session.accessToken!, refreshToken: session.refreshToken!, expiresAt: session.accessTokenExpiresAt ?? 0 })
    if (accountId !== session.accountId) throw new Error("Your mail account changed; sign in again.")
    const inbox = await client.mail.findRoleMailbox("inbox", accountId)
    if (!inbox) throw new Error("Inbox is unavailable for snooze.")
    const threads = await client.mail.getThreads(data.threadIds, accountId)
    const members = [...new Set(threads.flatMap(thread => thread.emailIds))]
    const inboxEmails = await client.mail.getEmailByIds(members, { properties: ["id", "mailboxIds"] }, accountId)
    const ids = inboxEmails.filter(email => email.mailboxIds[inbox.id]).map(email => email.id)
    if (!ids.length) throw new Error("The selected conversations are no longer available.")
    const job = await queueJob(session, "snooze", { ids }, wakeAt, data.requestId)
    try {
      await client.mail.setKeywords(ids, { $snoozed: true }, accountId)
      await client.mail.archive(ids, accountId)
    } catch (error) {
      const rollback = await Promise.allSettled([client.mail.unarchive(ids, accountId), client.mail.setKeywords(ids, { $snoozed: false }, accountId)])
      if (rollback.every(result => result.status === "fulfilled")) await cancelJob(session, job.id)
      else throw new Error("Snooze may have partially applied. Check the conversation and Outbox; the wake job remains queued.")
      throw error
    }
    return job
  })

export const cancelMailJob = createServerFn({ method: "POST" }).validator((input: unknown) => input as { id: string }).handler(async ({ data }) => {
  const session = await requireSession()
  if (!/^[0-9a-f-]{36}$/i.test(data.id)) throw new Error("Invalid job ID.")
  await cancelJob(session, data.id)
  return { ok: true }
})
export const retryMailJob = createServerFn({ method: "POST" }).validator((input: unknown) => input as { id: string }).handler(async ({ data }) => {
  const session = await requireSession()
  if (!/^[0-9a-f-]{36}$/i.test(data.id)) throw new Error("Invalid job ID.")
  await retryJob(session, data.id)
  return { ok: true }
})
