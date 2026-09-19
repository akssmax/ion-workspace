/**
 * Date and time helpers used across the workspace (date-fns based).
 */

import {
  differenceInCalendarDays,
  endOfMonth,
  format,
  formatDistanceToNowStrict,
  isSameDay,
  isSameMonth,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
  startOfDay,
  startOfMonth,
  endOfDay,
} from "date-fns"
import { ar, de, es, fr, hi } from "date-fns/locale"
import type { Language } from "./language"

const relativeLocales = { ar, de, es, fr, hi }

export function toDate(value: string | number | Date): Date {
  if (typeof value === "number") return new Date(value)
  if (typeof value === "string") {
    const epoch = Number(value)
    if (/^\d+$/.test(value) && epoch > 1_000_000_000_000) return new Date(epoch)
    return parseISO(value)
  }
  return value
}

/**
 * Coerce unknown input into a valid Date, or null when impossible.
 * Dates that cross a JSON boundary (e.g. zustand persist rehydration)
 * come back as ISO strings or epoch numbers — this revives them safely
 * instead of crashing on `.getFullYear is not a function`.
 */
export function coerceDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  if (typeof value === "number" || typeof value === "string") {
    if (value === "") return null
    const parsed = toDate(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

/** Short time like "14:30". */
export function formatTime(value: string | number | Date): string {
  return format(toDate(value), "p")
}

/** "Today", "Yesterday", weekday, or full date. */
export function formatDay(value: string | number | Date): string {
  const date = toDate(value)
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"
  if (isTomorrow(date)) return "Tomorrow"
  if (differenceInCalendarDays(date, new Date()) < 7)
    return format(date, "EEEE")
  return format(date, "MMM d")
}

export function formatDate(
  value: string | number | Date,
  fmt = "MMM d, yyyy"
): string {
  return format(toDate(value), fmt)
}

export function formatDateTime(value: string | number | Date): string {
  const date = toDate(value)
  if (isSameDay(date, new Date())) return format(date, "p")
  if (differenceInCalendarDays(date, new Date()) < 7)
    return format(date, "EEE p")
  return format(date, "MMM d, yyyy p")
}

export function formatRelative(value: string | number | Date, language: Language = "en"): string {
  return formatDistanceToNowStrict(toDate(value), { addSuffix: true, locale: language === "en" ? undefined : relativeLocales[language] })
}

export function emailListTime(value: string | number | Date): string {
  const date = toDate(value)
  if (isSameDay(date, new Date())) return format(date, "HH:mm")
  if (differenceInCalendarDays(date, new Date()) < 7) return format(date, "EEE")
  return format(date, "MMM d")
}

export function utcToDate(value: string): Date {
  return toDate(value)
}

/** JS Date → JMAP UtcDate (millisecond string). */
export function dateToUtc(value: Date): string {
  return String(value.getTime())
}

export function toJmapInstant(value: Date): string {
  return value.toISOString()
}

export function monthBounds(value: Date): { start: Date; end: Date } {
  const start = startOfMonth(value)
  return { start, end: endOfMonth(start) }
}

export function dayBounds(value: Date): { start: Date; end: Date } {
  return { start: startOfDay(value), end: endOfDay(value) }
}

export function addDaysDelta(value: Date, days: number): Date {
  const out = new Date(value)
  out.setDate(out.getDate() + days)
  return out
}

export function isSameMonthWith(value: Date, reference: Date): boolean {
  return isSameMonth(value, reference)
}

export function startOfDayDate(value: Date): Date {
  return startOfDay(value)
}

export function minutesToDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const parts: string[] = []
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  return parts.join(" ") || "0m"
}

export function durationToMinutes(isoDuration: string | undefined): number {
  if (!isoDuration) return 60
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(isoDuration)
  const h = Number(match?.[1] ?? 0)
  const m = Number(match?.[2] ?? 0)
  return h * 60 + m
}
