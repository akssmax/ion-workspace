import { describe, expect, it } from "vitest"
import { MockJmapProvider } from "../provider/MockJmapProvider"
import type { Mailbox } from "../types/mail"

/**
 * Bulk-action contract tests: every toolbar bulk mutation (read, star,
 * label, move, archive, trash, restore) is exercised against the mock
 * server and verified through fresh queries — the same data path the
 * UI's React Query invalidation re-reads.
 */
async function setup() {
  const provider = new MockJmapProvider()
  const client = await provider.createClient()
  const mail = client.mail
  const mailboxes = await mail.getMailboxes()
  const byRole = (role: string) => {
    const m = mailboxes.find((mb) => mb.role === role)
    if (!m) throw new Error(`missing ${role} mailbox`)
    return m
  }
  const inbox = byRole("inbox")
  const { ids } = await mail.queryEmails(inbox.id, { collapseThreads: false })
  expect(ids.length).toBeGreaterThan(1)
  return { mail, mailboxes, byRole, inbox, ids }
}

function labelsOf(mailboxes: Mailbox[]): Mailbox[] {
  // Label mailboxes are the ones without a standard role.
  return mailboxes.filter((m) => m.role == null && m.name !== "Starred")
}

describe("bulk mail actions", () => {
  it("markRead clears $seen and zeroes the inbox unread counter", async () => {
    const { mail, inbox, ids } = await setup()

    await mail.markRead(ids, true)

    const { emails } = await mail.getEmails(inbox.id, {
      collapseThreads: false,
    })
    expect(emails.length).toBeGreaterThan(0)
    for (const e of emails) expect(e.keywords?.$seen).toBe(true)

    const after = await mail.getMailboxes()
    expect(after.find((m) => m.id === inbox.id)?.unreadEmails).toBe(0)
  }, 10_000)

  it("markRead(ids, false) restores unread state", async () => {
    const { mail, inbox, ids } = await setup()

    await mail.markRead(ids, true)
    await mail.markRead([ids[0]], false)

    const { emails } = await mail.getEmails(inbox.id, {
      collapseThreads: false,
    })
    const target = emails.find((e) => e.id === ids[0])
    expect(target?.keywords?.$seen).not.toBe(true)
    const after = await mail.getMailboxes()
    expect(after.find((m) => m.id === inbox.id)?.unreadEmails).toBe(1)
  }, 10_000)

  it("markStarred toggles $flagged without touching $seen", async () => {
    const { mail, inbox, ids } = await setup()

    await mail.markRead(ids, true)
    await mail.markStarred(ids, true)

    const { emails } = await mail.getEmails(inbox.id, {
      collapseThreads: false,
    })
    for (const e of emails) {
      expect(e.keywords?.$flagged).toBe(true)
      expect(e.keywords?.$seen).toBe(true)
    }

    await mail.markStarred([ids[0]], false)
    const { emails: after } = await mail.getEmails(inbox.id, {
      collapseThreads: false,
    })
    expect(after.find((e) => e.id === ids[0])?.keywords?.$flagged).not.toBe(
      true
    )
  }, 10_000)

  it("applyLabel adds mailbox membership while preserving inbox", async () => {
    const { mail, mailboxes, inbox, ids } = await setup()
    const label = labelsOf(mailboxes)[0]
    expect(label).toBeDefined()

    await mail.applyLabel(ids, label.id, true)

    const { emails } = await mail.getEmails(inbox.id, {
      collapseThreads: false,
    })
    for (const e of emails) {
      expect(e.mailboxIds[label.id]).toBe(true)
      // Multi-mailbox semantics: still in the inbox.
      expect(e.mailboxIds[inbox.id]).toBe(true)
    }

    // And the label mailbox now lists them.
    const labelled = await mail.queryEmails(label.id, {
      collapseThreads: false,
    })
    for (const id of ids) expect(labelled.ids).toContain(id)
  }, 10_000)

  it("applyLabel(ids, label, false) removes only that membership", async () => {
    const { mail, mailboxes, inbox, ids } = await setup()
    const label = labelsOf(mailboxes)[0]

    await mail.applyLabel(ids, label.id, true)
    await mail.applyLabel([ids[0]], label.id, false)

    const { emails } = await mail.getEmails(inbox.id, {
      collapseThreads: false,
    })
    expect(emails.find((e) => e.id === ids[0])?.mailboxIds[label.id]).not.toBe(
      true
    )
    for (const e of emails.filter((e) => e.id !== ids[0])) {
      expect(e.mailboxIds[label.id]).toBe(true)
    }
  }, 10_000)

  it("archive empties the inbox and updates mailbox counters", async () => {
    const { mail, inbox, byRole, ids } = await setup()
    const archive = byRole("archive")

    await mail.archive(ids)

    const inboxAfter = await mail.queryEmails(inbox.id, {
      collapseThreads: false,
      calculateTotal: true,
    })
    expect(inboxAfter.total).toBe(0)

    const archiveAfter = await mail.queryEmails(archive.id, {
      collapseThreads: false,
    })
    for (const id of ids) expect(archiveAfter.ids).toContain(id)

    const mailboxesAfter = await mail.getMailboxes()
    expect(mailboxesAfter.find((m) => m.id === inbox.id)?.totalEmails).toBe(0)
  }, 10_000)

  it("trash moves emails to the trash mailbox", async () => {
    const { mail, inbox, byRole, ids } = await setup()
    const trash = byRole("trash")

    await mail.trash([ids[0]])

    const inboxAfter = await mail.queryEmails(inbox.id, {
      collapseThreads: false,
    })
    expect(inboxAfter.ids).not.toContain(ids[0])
    const trashAfter = await mail.queryEmails(trash.id, {
      collapseThreads: false,
    })
    expect(trashAfter.ids).toContain(ids[0])
  }, 10_000)

  it("moveEmails restores archived mail back to the inbox", async () => {
    const { mail, inbox, byRole, ids } = await setup()
    const archive = byRole("archive")

    await mail.archive(ids)
    await mail.moveEmails(ids, inbox.id)

    const inboxAfter = await mail.queryEmails(inbox.id, {
      collapseThreads: false,
    })
    for (const id of ids) expect(inboxAfter.ids).toContain(id)
    const archiveAfter = await mail.queryEmails(archive.id, {
      collapseThreads: false,
    })
    for (const id of ids) expect(archiveAfter.ids).not.toContain(id)
  }, 10_000)
})
