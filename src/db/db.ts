/**
 * Dexie (IndexedDB) schema for the read-through cache.
 *
 * Stalwart remains authoritative; the cache enables offline reads, faster
 * secondary paints, and diffing for push notifications.
 */

import Dexie, { type EntityTable } from "dexie"
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

  constructor() {
    super("WorkspaceTool")
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
  }
}

export const db = new WorkspaceDb()

export async function clearWorkspaceCache(): Promise<void> {
  await Promise.all([
    db.mailboxes.clear(),
    db.emails.clear(),
    db.threads.clear(),
    db.identities.clear(),
    db.events.clear(),
    db.contacts.clear(),
    db.files.clear(),
    db.syncMeta.clear(),
  ])
}

export type { EntityTable }
