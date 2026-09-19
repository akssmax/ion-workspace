/**
 * Sync engine: keeps the Dexie cache warm and (later) forwards JMAP Push
 * notifications from the transport into React Query invalidation.
 *
 * The UI always reads through React Query, but on first paint and on
 * transient failures it can fall back to the cache here.
 */

import { db } from "../../db/db"
import type { JmapId } from "../../jmap/types/mail"
import * as mailService from "../../services/mail/mail.service"
import * as calendarService from "../../services/calendar/calendar.service"
import * as contactsService from "../../services/contacts/contacts.service"
import * as filesService from "../../services/files/files.service"

type PushListener = () => void

class SyncEngine {
  private listeners = new Set<PushListener>()
  private syncing = new Set<string>()

  /**
   * Cache the mailbox list (returns directly, UI can show cached instantly).
   */
  async ensureMailboxes(): Promise<void> {
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
    const key = `mailbox:${mailboxId}`
    if (this.syncing.has(key)) {
      throw new Error("already syncing")
    }
    this.syncing.add(key)
    try {
      const result = await mailService.getEmails(mailboxId, { limit: 120 })
      const emails = result.emails.map((e) => ({
        ...e,
        mailboxIdsList: Object.keys(e.mailboxIds ?? {}),
      }))
      if (emails.length) {
        await db.emails.bulkPut(emails)
        const threadIds = [...new Set(emails.map((e) => e.threadId))].filter(
          Boolean
        ) as JmapId[]
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
    const ids = await db.emails
      .where("mailboxIdsList")
      .equals(mailboxId)
      .sortBy("receivedAt")
    return ids.slice(-limit).reverse()
  }

  async cacheThread(threadId: string): Promise<void> {
    try {
      const { thread, emails } = await mailService.getThread(threadId)
      await db.threads.put(thread)
      await db.emails.bulkPut(emails)
    } catch {
      /* offline */
    }
  }

  async syncEvents(): Promise<void> {
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
    try {
      const contacts = await contactsService.getAllContacts()
      await db.contacts.bulkPut(contacts)
    } catch {
      /* offline */
    }
  }

  async syncFiles(): Promise<void> {
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

type CachedEmailLike = import("../../db/db").CachedEmail

export const syncEngine = new SyncEngine()
