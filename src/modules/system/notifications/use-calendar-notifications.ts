/**
 * Calendar event reminders.
 *
 * Client-side scheduler over upcoming events: while the app is open, each event
 * fires once at its reminder lead time (from the event's alert offset, or a
 * sane default). Server-side/background reminders are a later phase.
 */

import { useEffect, useState } from "react"
import { useUpcomingEvents } from "@/queries/calendar"
import { useNotificationPrefs } from "@/queries/preferences"
import { eventStart } from "@/lib/calendar-event"
import type { CalendarEvent } from "@/jmap/types/calendar"
import { alreadyNotified, deliver, openEvent } from "./notify-core"

const DEFAULT_REMINDER_MINUTES = 10
const POLL_MS = 30_000
const ON_TIME_WINDOW_MS = 60_000

export function useCalendarNotifications(featureEnabled: boolean): void {
  const prefs = useNotificationPrefs()
  const eventsQuery = useUpcomingEvents(2)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), POLL_MS)
    return () => window.clearInterval(id)
  }, [])

  const enabled = featureEnabled && prefs.calendarEnabled
  const events = eventsQuery.data
  const sound = prefs.calendarSound ? prefs.sound : undefined

  useEffect(() => {
    if (!enabled || !events?.length) return
    for (const event of events) {
      const start = eventStart(event).getTime()
      if (!Number.isFinite(start)) continue
      const fireAt = start - reminderMinutesBefore(event) * 60_000
      if (now < fireAt || now > start + ON_TIME_WINDOW_MS) continue
      const key = `${event.id}:${event.start}`
      if (alreadyNotified(key)) continue
      deliver({
        id: key,
        title: event.title || "Event reminder",
        body: reminderBody(event, start, now),
        sound,
        onClick: () => openEvent(event.id),
      })
    }
  }, [enabled, events, now, sound])
}

/** Earliest reminder lead (minutes before start) declared on the event. */
function reminderMinutesBefore(event: CalendarEvent): number {
  const offsets: number[] = []
  for (const alert of Object.values(event.alerts ?? {})) {
    const minutes = parseOffsetMinutes(alert.trigger.offset)
    if (minutes !== null) offsets.push(minutes)
  }
  for (const reminder of event.reminders ?? []) {
    const minutes = parseOffsetMinutes(reminder.trigger)
    if (minutes !== null) offsets.push(minutes)
  }
  if (!offsets.length) return DEFAULT_REMINDER_MINUTES
  return Math.max(0, Math.min(...offsets))
}

/** Parse an ISO-8601 duration offset such as "-PT15M", "-PT1H30M", "-P1D". */
export function parseOffsetMinutes(offset?: string | null): number | null {
  if (!offset) return null
  const match =
    /^(-)?P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(offset)
  if (!match) return null
  const [, negative, days, hours, minutes, seconds] = match
  const total =
    (Number(days) || 0) * 1440 +
    (Number(hours) || 0) * 60 +
    (Number(minutes) || 0) +
    (Number(seconds) || 0) / 60
  if (!Number.isFinite(total)) return null
  return negative ? -total : total
}

function reminderBody(
  event: CalendarEvent,
  start: number,
  now: number
): string {
  const minutes = Math.round((start - now) / 60_000)
  const location = event.location ? ` · ${event.location}` : ""
  if (minutes <= 0) return `Happening now${location}`
  if (minutes === 1) return `Starts in 1 minute${location}`
  if (minutes < 60) return `Starts in ${minutes} minutes${location}`
  const hours = Math.round(minutes / 60)
  return `Starts in ${hours} hour${hours === 1 ? "" : "s"}${location}`
}
