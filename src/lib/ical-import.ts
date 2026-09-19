import ICAL from "ical.js"
import type { CalendarEvent, RecurrenceRule } from "@/jmap/types/calendar"

export interface ParsedCalendarFile {
  events: Partial<CalendarEvent>[]
  errors: string[]
}

export function parseCalendarFile(contents: string): ParsedCalendarFile {
  if (contents.length > 10_000_000) throw new Error("File exceeds 10 MB.")
  const root = ICAL.Component.fromString(contents)
  if (root.name !== "vcalendar")
    throw new Error("Choose a valid iCalendar (.ics) file.")
  const items = root.getAllSubcomponents("vevent")
  if (items.length > 10_000)
    throw new Error("A file may contain at most 10,000 events.")
  const events: Partial<CalendarEvent>[] = []
  const errors: string[] = []
  for (const item of items) {
    try {
      const source = new ICAL.Event(item)
      const uid = String(item.getFirstPropertyValue("uid") ?? "")
      if (!uid) throw new Error("Missing UID")
      if (item.getFirstPropertyValue("recurrence-id"))
        throw new Error(`Recurring exception ${uid} needs server-side override support and was not imported`)
      const start = source.startDate
      const end = source.endDate
      if (!start || !end) throw new Error("Missing start or end")
      const allDay = start.isDate
      const startValue = start.toString().replace(/Z$/, "Z")
      const rule = item.getFirstPropertyValue("rrule")
      const recur = rule instanceof ICAL.Recur ? rule : null
      const recurrenceRule: RecurrenceRule | undefined = recur
        ? {
            frequency: recur.freq as RecurrenceRule["frequency"],
            interval: recur.interval || 1,
            ...(recur.count ? { count: recur.count } : {}),
            ...(recur.until ? { until: recur.until.toString() } : {}),
            ...(recur.parts.BYDAY ? { byDay: recur.parts.BYDAY.map(String) } : {}),
            ...(recur.parts.BYMONTH ? { byMonth: recur.parts.BYMONTH.map(Number) } : {}),
            ...(recur.parts.BYMONTHDAY ? { byMonthDay: recur.parts.BYMONTHDAY.map(Number) } : {}),
          }
        : undefined
      const attendees = item
        .getAllProperties("attendee")
        .map((property) =>
          String(property.getFirstValue()).replace(/^mailto:/i, "")
        )
      const durationMs = end.toJSDate().getTime() - start.toJSDate().getTime()
      if (durationMs <= 0) throw new Error("End must follow start")
      events.push({
        uid,
        title: String(item.getFirstPropertyValue("summary") ?? "(untitled)"),
        description: String(item.getFirstPropertyValue("description") ?? ""),
        location: String(item.getFirstPropertyValue("location") ?? ""),
        start: allDay ? `${startValue.slice(0, 10)}T00:00:00` : startValue,
        timeZone: allDay
          ? null
          : start.zone?.tzid === "floating"
            ? null
            : (start.zone?.tzid ?? null),
        duration: allDay
          ? `P${Math.round(durationMs / 86_400_000)}D`
          : `PT${Math.round(durationMs / 60_000)}M`,
        showWithoutTime: allDay,
        ...(recurrenceRule ? { recurrenceRules: [recurrenceRule] } : {}),
        ...(attendees.length
          ? {
              participants: Object.fromEntries(
                attendees.map((email) => [
                  `mailto:${email}`,
                  { email, roles: { attendee: true } },
                ])
              ),
            }
          : {}),
      })
    } catch (cause) {
      errors.push(
        cause instanceof Error ? cause.message : "Could not parse event"
      )
    }
  }
  return { events, errors }
}
