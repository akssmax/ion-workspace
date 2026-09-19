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

  it("archive keeps multiple labels and does not destroy the email", async () => {
    const { mail, mailboxes, inbox, byRole, ids } = await setup()
    const labels = labelsOf(mailboxes).slice(0, 2)
    expect(labels).toHaveLength(2)
    await mail.applyLabel([ids[0]], labels[0].id, true)
    await mail.applyLabel([ids[0]], labels[1].id, true)

    await mail.archive([ids[0]])
    const [email] = await mail.getEmailByIds([ids[0]], {
      properties: ["id", "mailboxIds"],
    })
    expect(email.mailboxIds[inbox.id]).not.toBe(true)
    expect(email.mailboxIds[byRole("archive").id]).toBe(true)
    for (const label of labels) expect(email.mailboxIds[label.id]).toBe(true)
  })

  it("unarchive returns archived mail to Inbox and keeps custom labels", async () => {
    const { mail, mailboxes, inbox, byRole, ids } = await setup()
    const labels = labelsOf(mailboxes).slice(0, 2)
    await mail.applyLabel([ids[0]], labels[0].id, true)
    await mail.applyLabel([ids[0]], labels[1].id, true)

    await mail.archive([ids[0]])
    await mail.unarchive([ids[0]])

    const [email] = await mail.getEmailByIds([ids[0]], {
      properties: ["id", "mailboxIds"],
    })
    expect(email.mailboxIds[inbox.id]).toBe(true)
    expect(email.mailboxIds[byRole("archive").id]).not.toBe(true)
    for (const label of labels) expect(email.mailboxIds[label.id]).toBe(true)
  })

  it("moving from a label removes that source but retains other labels", async () => {
    const { mail, mailboxes, ids } = await setup()
    const [source, keep, target] = labelsOf(mailboxes).slice(0, 3)
    expect(target).toBeDefined()
    await mail.applyLabel([ids[0]], source.id, true)
    await mail.applyLabel([ids[0]], keep.id, true)
    await mail.moveEmails([ids[0]], target.id, undefined, source.id)
    const [email] = await mail.getEmailByIds([ids[0]], {
      properties: ["id", "mailboxIds"],
    })
    expect(email.mailboxIds[source.id]).not.toBe(true)
    expect(email.mailboxIds[keep.id]).toBe(true)
    expect(email.mailboxIds[target.id]).toBe(true)
  })

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

  it("reports spam or phishing and restores messages to the inbox", async () => {
    const { mail, inbox, byRole, ids } = await setup()
    await mail.reportJunk([ids[0]], true)
    const [reported] = await mail.getEmailByIds([ids[0]])
    expect(reported.mailboxIds[byRole("junk").id]).toBe(true)
    expect(reported.keywords?.$phishing).toBe(true)
    await mail.markNotJunk([ids[0]])
    const [restored] = await mail.getEmailByIds([ids[0]])
    expect(restored.mailboxIds[inbox.id]).toBe(true)
    expect(restored.keywords?.$junk).not.toBe(true)
    expect(restored.keywords?.$phishing).not.toBe(true)
  })

  it("permanently destroys a message after moving it to trash", async () => {
    const { mail, ids } = await setup()
    await mail.trash([ids[0]])
    await mail.destroyEmails([ids[0]])
    expect(await mail.getEmailByIds([ids[0]])).toEqual([])
  })

  it("threads a sent reply using its in-reply-to reference", async () => {
    const { mail, inbox, ids, byRole } = await setup()
    const [original] = await mail.getEmailByIds([ids[0]])
    const [identity] = await mail.getIdentities()
    await mail.sendEmail({
      identityId: identity.id,
      from: [{ email: identity.email, name: identity.name }],
      to: original.from ?? [],
      subject: `Re: ${original.subject}`,
      textBody: "Reply body",
      inReplyTo: [original.messageId ?? original.id],
      references: [original.messageId ?? original.id],
    })
    const sent = await mail.getEmails(byRole("sent").id, {
      collapseThreads: false,
    })
    const reply = sent.emails.find(
      (email) => email.subject === `Re: ${original.subject}`
    )
    expect(reply?.threadId).toBe(original.threadId)
    const [fullReply] = await mail.getEmailByIds([reply!.id])
    expect(fullReply.inReplyTo).toContain(original.messageId ?? original.id)
    const stillInbox = await mail.queryEmails(inbox.id, {
      collapseThreads: false,
    })
    expect(stillInbox.ids).toContain(ids[0])
  })

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
