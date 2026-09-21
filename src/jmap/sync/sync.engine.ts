import { isDemoRuntime } from "@/lib/demo/runtime"
/**
 * Sync engine: keeps the Dexie cache warm and (later) forwards JMAP Push
 * notifications from the transport into React Query invalidation.
 *
 * The UI always reads through React Query, but on first paint and on
 * transient failures it can fall back to the cache here.
 */

import { db } from "../../db/db"
import type { CachedEmail } from "../../db/db"
import type { EmailProperties, Thread } from "../../jmap/types/mail"
import * as mailService from "../../services/mail/mail.service"
import * as calendarService from "../../services/calendar/calendar.service"
import * as contactsService from "../../services/contacts/contacts.service"
import * as filesService from "../../services/files/files.service"

type PushListener = () => void

class SyncEngine {
  private listeners = new Set<PushListener>()
  private syncing = new Set<string>()
  /** Signature of the last payload written per email, to skip no-op writes. */
  private written = new Map<string, string>()

  async storeMailPage(
    accountId: string,
    emails: EmailProperties[]
  ): Promise<void> {
    if (isDemoRuntime) return
    const changed = emails.filter((email) => {
      const key = `${accountId}:${email.id}`
      const signature = JSON.stringify([
        email.receivedAt,
        email.threadId,
        email.mailboxIds,
        email.keywords,
        email.threadEmailCount,
      ])
      if (this.written.get(key) === signature) return false
      this.written.set(key, signature)
      return true
    })
    if (changed.length === 0) return
    if (this.written.size > 5000) this.written.clear()
    await db.mailCache.bulkPut(
      changed.map((email) => ({
        ...email,
        accountId,
        cacheKey: `${accountId}:${email.id}`,
        mailboxIdsList: Object.keys(email.mailboxIds),
      }))
    )
  }

  async offlineMailPage(
    accountId: string,
    mailboxId: string,
    position: number,
    limit: number
  ) {
    if (isDemoRuntime)
      throw new Error("Demo data is unavailable. Reset the demo to try again.")
    const accountEmails = await db.mailCache
      .where("accountId")
      .equals(accountId)
      .toArray()
    const matches = accountEmails
      .filter((email) => mailboxId === "all" || email.mailboxIds[mailboxId])
      .sort((a, b) => (b.receivedAt ?? "").localeCompare(a.receivedAt ?? ""))
    const emails = matches.slice(position, position + limit)
    return {
      mailboxes: [],
      queryState: "offline",
      position,
      ids: emails.map((email) => email.id),
      total: matches.length,
      emails,
      notFound: [],
      state: "offline",
    }
  }

  async storeThread(
    accountId: string,
    thread: Thread,
    emails: EmailProperties[]
  ) {
    if (isDemoRuntime) return
    await db.threadCache.put({
      ...thread,
      accountId,
      cacheKey: `${accountId}:${thread.id}`,
    })
    await this.storeMailPage(accountId, emails)
  }

  async offlineThread(accountId: string, threadId: string) {
    if (isDemoRuntime) return null
    const thread = await db.threadCache.get(`${accountId}:${threadId}`)
    if (!thread) return null
    const emails = await Promise.all(
      thread.emailIds.map((id) => db.mailCache.get(`${accountId}:${id}`))
    )
    return {
      thread,
      emails: emails.filter(
        (email): email is NonNullable<typeof email> => !!email
      ),
    }
  }

  /**
   * Cache the mailbox list (returns directly, UI can show cached instantly).
   */
  async ensureMailboxes(): Promise<void> {
    if (isDemoRuntime) return
    try {
      const mailboxes = await mailService.getMailboxes()
      await db.mailboxes.bulkPut(mailboxes)
    } catch {
      // offline: cache is enough
    }
  }

  /**
   * Sync an email list for a mailbox (query + fetch + cache).
   * Returns the cached email list for immediate rendering.
   */
  async syncMailbox(
    mailboxId: string
  ): Promise<Awaited<ReturnType<typeof mailService.getEmails>>> {
    if (isDemoRuntime) return mailService.getEmails(mailboxId, { limit: 120 })
    const key = `mailbox:${mailboxId}`
    if (this.syncing.has(key)) {
      throw new Error("already syncing")
    }
    this.syncing.add(key)
    try {
      const result = await mailService.getEmails(mailboxId, { limit: 120 })
      const emails = result.emails.map((e) => ({
        ...e,
        mailboxIdsList: Object.keys(e.mailboxIds),
      }))
      if (emails.length) {
        await db.emails.bulkPut(emails)
        const threadIds = [...new Set(emails.map((e) => e.threadId))].filter(
          Boolean
        )
        if (threadIds.length) {
          const threads = await mailService.getThreads(threadIds)
          await db.threads.bulkPut(threads)
        }
      }
      await this.ensureMailboxes()
      await db.syncMeta.put({
        key,
        state: result.queryState,
        updatedAt: Date.now(),
      })
      return result
    } finally {
      this.syncing.delete(key)
    }
  }

  /** Cached emails for a mailbox (offline / first paint). */
  async cachedEmailsFor(
    mailboxId: string,
    limit = 120
  ): Promise<CachedEmailLike[]> {
    if (isDemoRuntime) return []
    const ids = await db.emails
      .where("mailboxIdsList")
      .equals(mailboxId)
      .sortBy("receivedAt")
    return ids.slice(-limit).reverse()
  }

  async cacheThread(threadId: string): Promise<void> {
    if (isDemoRuntime) return
    try {
      const { thread, emails } = await mailService.getThread(threadId)
      await db.threads.put(thread)
      await db.emails.bulkPut(emails)
    } catch {
      /* offline */
    }
  }

  async syncEvents(): Promise<void> {
    if (isDemoRuntime) return
    try {
      const events = await calendarService.getEventsInRange(
        new Date(0).toISOString(),
        new Date("2999-01-01").toISOString()
      )
      await db.events.bulkPut(events)
    } catch {
      /* offline */
    }
  }

  async syncContacts(): Promise<void> {
    if (isDemoRuntime) return
    try {
      const contacts = await contactsService.getAllContacts()
      await db.contacts.bulkPut(contacts)
    } catch {
      /* offline */
    }
  }

  async syncFiles(): Promise<void> {
    if (isDemoRuntime) return
    try {
      const files = await filesService.listFiles(null)
      await db.files.bulkPut(files)
    } catch {
      /* offline */
    }
  }

  onPush(cb: PushListener): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  emitPush(): void {
    for (const cb of this.listeners) cb()
  }
}

type CachedEmailLike = CachedEmail

export const syncEngine = new SyncEngine()
