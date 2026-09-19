/**
 * Color + urgency helpers for the upcoming-events island.
 *
 * Urgency (live / soon) wins so the pill reads at a glance. Otherwise we
 * pick a hue from the event kind (meeting, social, travel, …) or the
 * calendar's stored accent.
 */

import { addMinutes, endOfDay } from "date-fns"
import type { CalendarEvent } from "@/jmap/types/calendar"
import { durationToMinutes, toDate } from "@/lib/dates"
import {
  accentClasses,
  accentForKey,
  parseAccent,
  type AccentName,
} from "@/lib/accents"

export type EventPhase = "live" | "soon" | "later"

export type EventKind = "meeting" | "social" | "travel" | "focus" | "allday"

const KIND_ACCENT: Record<EventKind, AccentName> = {
  meeting: "violet",
  social: "orange",
  travel: "sky",
  focus: "lime",
  allday: "fuchsia",
}

const PHASE_ACCENT: Record<EventPhase, AccentName> = {
  live: "emerald",
  soon: "amber",
  later: "blue",
}

export function eventStart(event: CalendarEvent): Date {
  return toDate(event.start)
}

export function eventEnd(event: CalendarEvent): Date {
  const start = eventStart(event)
  if (event.allDay || event.showWithoutTime) return endOfDay(start)
  const minutes = durationToMinutes(event.duration)
  return addMinutes(start, minutes > 0 ? minutes : 60)
}

export function eventPhase(event: CalendarEvent, now = new Date()): EventPhase {
  const start = eventStart(event)
  const end = eventEnd(event)
  if (start <= now && now < end) return "live"
  const ms = start.getTime() - now.getTime()
  if (ms > 0 && ms <= 30 * 60_000) return "soon"
  return "later"
}

export function eventKind(event: CalendarEvent): EventKind {
  if (event.allDay || event.showWithoutTime) return "allday"
  const haystack = `${event.title ?? ""} ${event.location ?? ""}`.toLowerCase()
  if (
    /\b(zoom|meet|call|sync|standup|stand-up|1:1|1-1|interview)\b/.test(
      haystack
    )
  ) {
    return "meeting"
  }
  if (/\b(lunch|coffee|dinner|breakfast|drinks)\b/.test(haystack)) {
    return "social"
  }
  if (/\b(flight|airport|travel|train|taxi)\b/.test(haystack)) return "travel"
  if (/\b(focus|deep work|heads.down)\b/.test(haystack)) return "focus"
  return "meeting"
}

export function islandAccent(
  event: CalendarEvent,
  calendarColor?: string | null
): AccentName {
  const phase = eventPhase(event)
  if (phase === "live" || phase === "soon") return PHASE_ACCENT[phase]
  const fromCalendar = parseAccent(calendarColor)
  if (fromCalendar) return fromCalendar
  return KIND_ACCENT[eventKind(event)] ?? accentForKey(event.calendarId)
}

export function islandTone(accent: AccentName) {
  return accentClasses(accent)
}
