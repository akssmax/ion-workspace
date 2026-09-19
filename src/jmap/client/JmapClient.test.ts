import { describe, expect, it } from "vitest"
import { JmapClient, coreUsing } from "./JmapClient"
import { MockJmapProvider } from "../provider/MockJmapProvider"
import { MockTransport } from "../provider/MockTransport"
import { MOCK_ACCOUNT_ID } from "../provider/mock/data"

describe("core JMAP session (*/session)", () => {
  it("discovers username, capabilities and the primary mail account", async () => {
    const client = new JmapClient(new MockTransport())
    const session = await client.session()
    expect(session.username).toBe(MOCK_ACCOUNT_ID)
    expect(session.primaryAccounts?.["urn:ietf:params:jmap:mail"]).toBe(
      MOCK_ACCOUNT_ID
    )
    expect(client.isMock).toBe(true)
  }, 10_000)
})

describe("MockJmapProvider", () => {
  it("createClient binds all namespaces to the mock account", async () => {
    const provider = new MockJmapProvider()
    const client = await provider.createClient()
    expect(client.mail.accountId).toBe("a1")
    expect(await provider.resolveAccountId(client)).toBe("a1")
  }, 10_000)
})

describe("mail round trip via MailApi", () => {
  async function makeClient() {
    const provider = new MockJmapProvider()
    const client = await provider.createClient()
    const mailboxes = await client.mail.getMailboxes()
    const inbox = mailboxes.find((m) => m.role === "inbox")
    expect(inbox).toBeDefined()
    return { client, inboxId: inbox!.id }
  }

  it("lists role-flagged mailboxes including inbox and trash", async () => {
    const { client } = await makeClient()
    const mailboxes = await client.mail.getMailboxes()
    const roles = mailboxes.map((m) => m.role)
    for (const role of [
      "inbox",
      "sent",
      "drafts",
      "archive",
      "junk",
      "trash",
    ]) {
      expect(roles).toContain(role)
    }
  }, 10_000)

  it("queries emails in the inbox (collapsed to threads)", async () => {
    const { client, inboxId } = await makeClient()
    const { ids, total } = await client.mail.queryEmails(inboxId, {
      collapseThreads: true,
      calculateTotal: true,
    })
    expect(ids.length).toBeGreaterThan(0)
    expect(total).toBe(ids.length)
  }, 10_000)

  it("fetches email properties with bodies", async () => {
    const { client, inboxId } = await makeClient()
    const { ids } = await client.mail.queryEmails(inboxId)
    const emails = await client.mail.getEmailByIds(ids.slice(0, 3))
    expect(emails.length).toBeGreaterThan(0)
    const first = emails[0]
    expect(first.threadId).toBeTruthy()
    expect(first.subject).toBeDefined()
    expect(Array.isArray(first.from)).toBe(true)
  }, 10_000)

  it("getThread returns the thread with its emails", async () => {
    const { client, inboxId } = await makeClient()
    const { ids } = await client.mail.queryEmails(inboxId)
    const emails = await client.mail.getEmailByIds(ids.slice(0, 1))
    const { thread, emails: threadEmails } = await client.mail.getThread(
      emails[0].threadId
    )
    expect(threadEmails.length).toBeGreaterThan(0)
    expect(threadEmails[0].threadId).toBe(thread.id)
  }, 10_000)

  it("marks emails read and flags them", async () => {
    const { client, inboxId } = await makeClient()
    const { ids } = await client.mail.queryEmails(inboxId)
    const target = ids[0]
    await client.mail.setKeywords([target], { $seen: true, $flagged: true })
    const emails = await client.mail.getEmailByIds([target])
    expect(emails[0].keywords?.["$seen"]).toBe(true)
    expect(emails[0].keywords?.["$flagged"]).toBe(true)
  }, 10_000)
})

describe("JmapClient.call + error handling", () => {
  it("throws an AppError for a method error response", async () => {
    const provider = new MockJmapProvider()
    const client = await provider.createClient()
    await expect(
      client.call("Bogus/method", { accountId: "a1" }, "x0")
    ).rejects.toMatchObject({ name: "AppError" })
  }, 10_000)

  it("exposes the core using list for mail + calendars", () => {
    expect(coreUsing).toEqual(
      expect.arrayContaining([
        "urn:ietf:params:jmap:core",
        "urn:ietf:params:jmap:mail",
        "urn:ietf:params:jmap:calendars",
      ])
    )
  })
})
