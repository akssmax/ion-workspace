import { describe, expect, it } from "vitest"
import { JmapClient } from "./JmapClient"
import { MockTransport } from "../provider/MockTransport"
import { MOCK_ACCOUNT_ID } from "../provider/mock/data"

describe("CalendarApi", () => {
  it("paginates a visible range without dropping events", async () => {
    const client = new JmapClient(new MockTransport())
    client.calendar.bindAccount(MOCK_ACCOUNT_ID)
    const start = "2026-10-01T10:00:00"
    const events = Array.from({ length: 260 }, (_, i) => ({ calendarId: "cal_personal", uid: `page-${i}`, title: `Page ${i}`, start, duration: "PT1H" }))
    await client.calendar.applyMutations({ create: events })
    const found = await client.calendar.getEventsInRange("2026-10-01T00:00:00Z", "2026-10-02T00:00:00Z")
    expect(found.filter((event) => event.uid.startsWith("page-")).length).toBe(260)
  })
  it("returns confirmed IDs and fails for missing updates", async () => {
    const client = new JmapClient(new MockTransport())
    client.calendar.bindAccount(MOCK_ACCOUNT_ID)
    const id = await client.calendar.createEvent({ calendarId: "cal_personal", title: "Test", start: "2026-10-01T10:00:00", duration: "PT1H" })
    expect(id).toMatch(/^evt/)
    await expect(client.calendar.updateEvent("missing", { title: "Bad" })).rejects.toThrow()
  })
})
