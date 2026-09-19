import { addMilliseconds, parseISO } from "date-fns"
import type { CalendarEvent, RecurrenceRule } from "@/jmap/types/calendar"

export interface CalendarDraft {
  title: string
  calendarId: string
  start: string
  end: string
  allDay: boolean
  timeZone: string
  description: string
  location: string
  meetingUrl: string
  guests: string[]
  recurrence: "none" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
  interval: number
  repeatUntil: string
  reminderMinutes: number | null
  busy: boolean
}

export function eventCalendarId(event: CalendarEvent): string {
  return event.calendarId ?? Object.keys(event.calendarIds ?? {})[0] ?? ""
}

export function eventStart(event: CalendarEvent): Date {
  const start = event.start
  if (/Z$|[+-]\d\d:\d\d$/.test(start)) return parseISO(start)
  if (event.timeZone) {
    // Resolve the local JSCalendar time in its named IANA zone, including DST.
    const target = parseISO(start)
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: event.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
    let guess = Date.UTC(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
      target.getHours(),
      target.getMinutes(),
      target.getSeconds()
    )
    for (let n = 0; n < 3; n++) {
      const fields = Object.fromEntries(
        parts
          .formatToParts(guess)
          .map((part) => [part.type, Number(part.value)])
      )
      const actual = Date.UTC(
        fields.year,
        fields.month - 1,
        fields.day,
        fields.hour,
        fields.minute,
        fields.second
      )
      const delta =
        Date.UTC(
          target.getFullYear(),
          target.getMonth(),
          target.getDate(),
          target.getHours(),
          target.getMinutes(),
          target.getSeconds()
        ) - actual
      if (!delta) break
      guess += delta
    }
    return new Date(guess)
  }
  return parseISO(start)
}

export function eventEnd(event: CalendarEvent): Date {
  const match =
    /^(?:P(?:(\d+)D)?)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
      event.duration ?? "PT1H"
    )
  const days = Number(match?.[1] ?? 0)
  const hours = Number(match?.[2] ?? 0)
  const minutes = Number(match?.[3] ?? 0)
  const seconds = Number(match?.[4] ?? 0)
  return addMilliseconds(
    eventStart(event),
    ((days * 24 + hours) * 60 + minutes) * 60_000 + seconds * 1000
  )
}

export function isAllDay(event: CalendarEvent): boolean {
  return Boolean(event.showWithoutTime ?? event.allDay)
}

export function eventLocation(event: CalendarEvent): string {
  return event.locations
    ? (Object.values(event.locations)[0]?.name ?? "")
    : (event.location ?? "")
}

export function eventGuests(event: CalendarEvent): string[] {
  if (event.participants && !Array.isArray(event.participants))
    return Object.keys(event.participants)
      .filter((value) => value.startsWith("mailto:"))
      .map((value) => value.slice(7))
  return (event.attendees ?? []).map((attendee) => attendee.email)
}

export function draftFromEvent(event: CalendarEvent): CalendarDraft {
  const start = eventStart(event)
  const end = eventEnd(event)
  const recurrence = event.recurrenceRules?.[0] ?? event.recurrenceRule
  return {
    title: event.title ?? "",
    calendarId: eventCalendarId(event),
    start: localInput(start),
    end: localInput(end),
    allDay: isAllDay(event),
    timeZone:
      event.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    description: event.description ?? "",
    location: eventLocation(event),
    meetingUrl:
      event.links?.find((link) => link.rel === "conference")?.href ?? "",
    guests: eventGuests(event),
    recurrence:
      recurrence?.frequency &&
      ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(recurrence.frequency)
        ? (recurrence.frequency as CalendarDraft["recurrence"])
        : "none",
    interval: recurrence?.interval ?? 1,
    repeatUntil: recurrence?.until?.slice(0, 10) ?? "",
    reminderMinutes: null,
    busy: (event.freeBusyStatus ?? "BUSY") !== "FREE",
  }
}

export function localInput(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`
}

export function draftToEvent(draft: CalendarDraft): Partial<CalendarEvent> {
  const start = new Date(draft.start)
  const end = new Date(draft.end)
  const durationMs = end.getTime() - start.getTime()
  if (!draft.title.trim()) throw new Error("Add a title.")
  if (!draft.calendarId) throw new Error("Choose a calendar.")
  if (!(durationMs > 0)) throw new Error("End must be after start.")
  const duration = draft.allDay
    ? `P${Math.max(1, Math.round(durationMs / 86_400_000))}D`
    : `PT${Math.round(durationMs / 60_000)}M`
  const recurrenceRule: RecurrenceRule | undefined =
    draft.recurrence === "none"
      ? undefined
      : {
          frequency: draft.recurrence,
          interval: Math.max(1, draft.interval),
          ...(draft.repeatUntil
            ? { until: `${draft.repeatUntil}T23:59:59` }
            : {}),
        }
  const participants = Object.fromEntries(
    draft.guests.map((email) => [
      `mailto:${email}`,
      {
        "@type": "Participant",
        email,
        name: email,
        roles: { attendee: true },
        participationStatus: "needs-action",
      },
    ])
  )
  return {
    calendarId: draft.calendarId,
    calendarIds: { [draft.calendarId]: true },
    title: draft.title.trim(),
    start: draft.allDay
      ? draft.start.slice(0, 10) + "T00:00:00"
      : draft.start + ":00",
    timeZone: draft.allDay ? null : draft.timeZone,
    duration,
    showWithoutTime: draft.allDay,
    description: draft.description || null,
    locations: draft.location
      ? { primary: { "@type": "Location", name: draft.location } }
      : undefined,
    links: draft.meetingUrl
      ? [{ href: draft.meetingUrl, rel: "conference" }]
      : undefined,
    freeBusyStatus: draft.busy ? "BUSY" : "FREE",
    participants: Object.keys(participants).length ? participants : undefined,
    recurrenceRules: recurrenceRule ? [recurrenceRule] : undefined,
    alerts:
      draft.reminderMinutes === null
        ? undefined
        : {
            reminder: {
              "@type": "Alert",
              action: "email",
              trigger: {
                "@type": "OffsetTrigger",
                offset: `-PT${draft.reminderMinutes}M`,
                relativeTo: "start",
              },
            },
          },
  }
}
