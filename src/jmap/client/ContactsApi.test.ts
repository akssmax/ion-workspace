import { describe, expect, it } from "vitest"
import { JmapClient } from "./JmapClient"
import { MockTransport } from "../provider/MockTransport"
import { MOCK_ACCOUNT_ID } from "../provider/mock/data"

describe("ContactsApi", () => {
  it("creates a contact that then appears in the address book", async () => {
    const client = new JmapClient(new MockTransport())
    client.contacts.bindAccount(MOCK_ACCOUNT_ID)

    const id = await client.contacts.createContact({
      fn: "Jane Doe",
      organization: "Acme Inc.",
      emails: [{ type: "work", value: "jane@example.com", isDefault: true }],
      phones: [{ type: "work", value: "+1 555 010 1234" }],
      notes: "Met at the conference",
      addressBookIds: { ab_main: true },
    })
    expect(id).toMatch(/^ct/)

    const all = await client.contacts.getAllContacts()
    const found = all.find((contact) => contact.id === id)
    expect(found).toBeDefined()
    expect(found?.fn).toBe("Jane Doe")
    expect(found?.organization).toBe("Acme Inc.")
    expect(found?.emails?.[0]?.value).toBe("jane@example.com")
    expect(found?.phones?.[0]?.value).toBe("+1 555 010 1234")
    expect(found?.notes).toBe("Met at the conference")
  })

  it("updates and destroys an existing contact", async () => {
    const client = new JmapClient(new MockTransport())
    client.contacts.bindAccount(MOCK_ACCOUNT_ID)

    const id = await client.contacts.createContact({
      fn: "Temp Contact",
      addressBookIds: { ab_main: true },
    })

    await client.contacts.updateContact(id, {
      fn: "Renamed Contact",
      emails: [{ type: "home", value: "renamed@example.com" }],
      phones: [],
    })
    const updated = (await client.contacts.getAllContacts()).find(
      (contact) => contact.id === id
    )
    expect(updated?.fn).toBe("Renamed Contact")
    expect(updated?.emails?.[0]?.value).toBe("renamed@example.com")
    expect(updated?.phones).toBeUndefined()

    await client.contacts.destroyContact(id)
    const gone = (await client.contacts.getAllContacts()).some(
      (contact) => contact.id === id
    )
    expect(gone).toBe(false)
  })

  it("finds created contacts through search", async () => {
    const client = new JmapClient(new MockTransport())
    client.contacts.bindAccount(MOCK_ACCOUNT_ID)

    await client.contacts.createContact({
      fn: "Searchable Name",
      emails: [{ type: "work", value: "searchable@example.com" }],
      addressBookIds: { ab_main: true },
    })

    const results = await client.contacts.search("Searchable")
    expect(results.some((contact) => contact.fn === "Searchable Name")).toBe(
      true
    )
  })
})
