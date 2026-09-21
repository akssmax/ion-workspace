import { describe, expect, it } from "vitest"
import { MockJmapProvider } from "@/jmap/provider/MockJmapProvider"

/**
 * End-to-end pipeline the mail notification hook relies on: a new inbound
 * message must emit a push event and be discoverable through `Email/changes`
 * from the previously seeded state (JMAP-native, no polling the list).
 */
describe("new-mail notification pipeline (mock)", () => {
  it("surfaces a delivered inbox message via push + Email/changes", async () => {
    const provider = new MockJmapProvider()
    const client = await provider.createClient()
    const accountId = client.mail.accountId

    const mailboxes = await client.mail.getMailboxes()
    const inbox = mailboxes.find((m) => m.role === "inbox")
    expect(inbox).toBeDefined()

    // Seed the "current state" exactly like the notification hook does.
    const seeded = await client.mail.changes(undefined)

    const events: string[] = []
    const subscription = client.startPush((payload) => {
      events.push(String(payload.type))
    })
    expect(subscription).not.toBeNull()

    // Simulate an inbound message landing in the inbox.
    const set = await client.call<{ created?: Record<string, { id: string }> }>(
      "Email/set",
      {
        accountId,
        create: {
          inbound: {
            mailboxIds: { [inbox!.id]: true },
            keywords: {},
            from: [{ name: "Sender", email: "sender@example.com" }],
            to: [{ email: "me@example.com" }],
            subject: "Hello from the outside",
            textBody: [{ type: "text/plain", partId: "1", blobId: null }],
            bodyValues: { "1": { value: "Ping" } },
          },
        },
      },
      "setInbound"
    )
    const createdId = set.created?.inbound.id
    expect(createdId).toBeTruthy()

    // The push subscriber must have been notified.
    expect(events).toContain("Email")

    // And the change set must report the new id as created.
    const changes = await client.mail.changes(seeded.newState)
    expect(changes.created).toContain(createdId)

    subscription!.close()
  }, 10_000)
})
