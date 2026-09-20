import { describe, expect, it } from "vitest"
import { JmapClient, coreUsing } from "./JmapClient"
import type { Transport } from "./transport"
import { MockJmapProvider } from "../provider/MockJmapProvider"
import { MockTransport } from "../provider/MockTransport"
import { MOCK_ACCOUNT_ID } from "../provider/mock/data"

function transportReturning(response: unknown[]): Transport {
  return {
    kind: "real",
    post: async () => response,
    upload: async () => ({ accountId: "a1", blobId: "b1", size: 0, type: "x" }),
    download: async () => new Blob(),
  }
}

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

  it("sends mail (create then submit by concrete id)", async () => {
    const { client } = await makeClient()
    const identities = await client.mail.getIdentities()
    const submissionId = await client.mail.sendEmail({
      identityId: identities[0].id,
      from: [{ name: identities[0].name, email: identities[0].email }],
      to: [{ email: "recipient@example.test" }],
      subject: "hello from the test",
      textBody: "hi",
    })
    expect(submissionId).toBeTruthy()
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

describe("response parsing parity (RFC 8620 §3.5)", () => {
  it("parses a real response that has no leading capability invocation", async () => {
    const client = new JmapClient(
      transportReturning([["Mailbox/get", { list: [{ id: "a" }] }, "mb0"]])
    )
    const result = await client.call<{ list: unknown[] }>(
      "Mailbox/get",
      { accountId: "a1" },
      "mb0"
    )
    expect(result.list).toEqual([{ id: "a" }])
  })

  it("parses a mock response that includes a leading capability invocation", async () => {
    const client = new JmapClient(
      transportReturning([
        ["urn:ietf:params:jmap:core", { using: [] }, "d0"],
        ["Mailbox/get", { list: [{ id: "a" }] }, "mb0"],
      ])
    )
    const result = await client.call<{ list: unknown[] }>(
      "Mailbox/get",
      { accountId: "a1" },
      "mb0"
    )
    expect(result.list).toEqual([{ id: "a" }])
  })

  it("parses a batched real response by matching call ids", async () => {
    const client = new JmapClient(
      transportReturning([
        ["Email/query", { ids: ["e1"] }, "eq1"],
        ["Email/get", { list: [{ id: "e1" }] }, "eg1"],
      ])
    )
    const batch = await client.invoke([
      { id: "eq1", method: "Email/query", args: { accountId: "a1" } },
      { id: "eg1", method: "Email/get", args: { accountId: "a1" } },
    ])
    expect(batch.get<{ ids: string[] }>("eq1").ids).toEqual(["e1"])
    expect(batch.get<{ list: { id: string }[] }>("eg1").list).toEqual([
      { id: "e1" },
    ])
  })
})
