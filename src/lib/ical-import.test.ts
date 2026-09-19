import { describe, expect, it } from "vitest"
import { parseCalendarFile } from "./ical-import"

const calendar = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Example//EN\r\nBEGIN:VEVENT\r\nUID:event-1@example.test\r\nDTSTART;VALUE=DATE:20260920\r\nDTEND;VALUE=DATE:20260922\r\nSUMMARY:Conference\r\nDESCRIPTION:Two days\r\nRRULE:FREQ=YEARLY;COUNT=3\r\nEND:VEVENT\r\nEND:VCALENDAR`

describe("iCalendar import", () => {
  it("keeps all-day exclusive end and recurrence", () => {
    const result = parseCalendarFile(calendar)
    expect(result.errors).toEqual([])
    expect(result.events[0]).toMatchObject({
      uid: "event-1@example.test",
      showWithoutTime: true,
      duration: "P2D",
      recurrenceRules: [{ frequency: "YEARLY", count: 3 }],
    })
  })
  it("rejects malformed files", () => {
    expect(() => parseCalendarFile("not a calendar")).toThrow()
  })
})
