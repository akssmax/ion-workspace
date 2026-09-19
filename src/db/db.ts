import { isDemoRuntime } from "@/lib/demo/runtime"
/**
 * Dexie (IndexedDB) schema for the read-through cache.
 *
 * Stalwart remains authoritative; the cache enables offline reads, faster
 * secondary paints, and diffing for push notifications.
 */

import Dexie from "dexie"
import type { EntityTable } from "dexie"
import type {
  EmailProperties,
  Mailbox,
  Identity,
  Thread,
} from "../jmap/types/mail"
import type { CalendarEvent } from "../jmap/types/calendar"
import type { Contact } from "../jmap/types/contacts"
import type { FileNode } from "../jmap/types/files"

export interface CachedEmail extends EmailProperties {
  /** Rendered/downloaded body stored locally for offline thread views. */
  localHtmlBody?: string | null
  /** Multi-entry index: the mailbox ids this email belongs to. */
  mailboxIdsList?: string[]
}

export interface AccountCachedEmail extends CachedEmail {
  cacheKey: string
  accountId: string
}

export interface AccountCachedThread extends Thread {
  cacheKey: string
  accountId: string
}

export interface SyncMeta {
  key: string
  state: string
  updatedAt: number
}

class WorkspaceDb extends Dexie {
  mailboxes!: EntityTable<Mailbox, "id">
  emails!: EntityTable<CachedEmail, "id">
  threads!: EntityTable<Thread, "id">
  identities!: EntityTable<Identity, "id">
  events!: EntityTable<CalendarEvent, "id">
  contacts!: EntityTable<Contact, "id">
  files!: EntityTable<FileNode, "id">
  syncMeta!: EntityTable<SyncMeta, "key">
  mailCache!: EntityTable<AccountCachedEmail, "cacheKey">
  threadCache!: EntityTable<AccountCachedThread, "cacheKey">

  constructor() {
    super("WorkspaceTool", { autoOpen: !isDemoRuntime })
    this.version(1).stores({
      mailboxes: "id, &role, name",
      emails: "id, threadId, receivedAt, *mailboxIdsList",
      threads: "id",
      identities: "id",
      events: "id, calendarId, start, end",
      contacts: "id",
      files: "id, parentId",
      syncMeta: "key",
    })
    this.version(2).stores({
      mailCache: "cacheKey, accountId, threadId, receivedAt",
      threadCache: "cacheKey, accountId",
    })
  }
}

export const db = new WorkspaceDb()

export async function clearWorkspaceCache(): Promise<void> {
  if (isDemoRuntime) return
  await Promise.all([
    db.mailboxes.clear(),
    db.emails.clear(),
    db.threads.clear(),
    db.identities.clear(),
    db.events.clear(),
    db.contacts.clear(),
    db.files.clear(),
    db.syncMeta.clear(),
    db.mailCache.clear(),
    db.threadCache.clear(),
  ])
}

export type { EntityTable }
