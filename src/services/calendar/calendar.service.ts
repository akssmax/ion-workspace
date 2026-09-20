/**
 * Calendar domain service.
 */

import type { Calendar, CalendarEvent, JmapId } from "../../jmap/types/calendar"
import { getJmapClient, getPrimaryAccountId } from "../jmap.service"
import { JMAP_CAPS } from "../../jmap/types"
import { parseCalendarFile, type ParsedCalendarFile } from "@/lib/ical-import"
import { isDemoRuntime } from "@/lib/demo/runtime"

export interface CalendarCapabilities {
  available: boolean
  parse: boolean
  availability: boolean
  accountReadOnly: boolean
  maxObjectsInSet: number
}

export async function getCalendarCapabilities(): Promise<CalendarCapabilities> {
  const client = await getJmapClient()
  const session = await client.session()
  const accountId = await getPrimaryAccountId(JMAP_CAPS.CALENDARS)
  const account = accountId ? session.accounts[accountId] : null
  const core = session.capabilities[JMAP_CAPS.CORE] as
    { maxObjectsInSet?: number } | undefined
  return {
    available: Boolean(
      accountId &&
      account?.accountCapabilities?.[JMAP_CAPS.CALENDARS] &&
      session.capabilities[JMAP_CAPS.CALENDARS]
    ),
    parse: Boolean(
      session.capabilities["urn:ietf:params:jmap:calendars:parse"]
    ),
    availability: Boolean(
      session.capabilities["urn:ietf:params:jmap:principals:availability"]
    ),
    accountReadOnly: Boolean(account?.isReadOnly),
    maxObjectsInSet: core?.maxObjectsInSet ?? 100,
  }
}

export async function getCalendars(): Promise<Calendar[]> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId("urn:ietf:params:jmap:calendars")
  if (!accountId) return []
  client.calendar.bindAccount(accountId)
  return client.calendar.getCalendars(accountId)
}

export async function createCalendar(
  name: string,
  color?: string
): Promise<string> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId(JMAP_CAPS.CALENDARS)
  if (!accountId) throw new Error("No calendar account available.")
  return client.calendar.createCalendar(name.trim(), color, accountId)
}

export async function getEventsInRange(
  start: string,
  end: string,
  options: { calendarIds?: string[]; timeZone?: string } = {}
): Promise<CalendarEvent[]> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId("urn:ietf:params:jmap:calendars")
  if (!accountId) return []
  client.calendar.bindAccount(accountId)
  return client.calendar.getEventsInRange(start, end, options, accountId)
}

export async function getEventById(id: string): Promise<CalendarEvent | null> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId(JMAP_CAPS.CALENDARS)
  if (!accountId) return null
  return (await client.calendar.getEventsByIds([id], accountId))[0] ?? null
}

export async function createEvent(
  event: Partial<CalendarEvent>,
  sendInvitations = true
): Promise<string> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId("urn:ietf:params:jmap:calendars")
  if (!accountId) throw new Error("No calendar account available.")
  client.calendar.bindAccount(accountId)
  return client.calendar.createEvent(event, accountId, sendInvitations)
}

export async function updateEvent(
  id: JmapId,
  patch: Partial<Record<string, unknown>>,
  sendInvitations = true
): Promise<void> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId("urn:ietf:params:jmap:calendars")
  if (!accountId) throw new Error("No calendar account available.")
  client.calendar.bindAccount(accountId)
  await client.calendar.updateEvent(id, patch, accountId, sendInvitations)
}

export async function destroyEvent(id: JmapId): Promise<void> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId("urn:ietf:params:jmap:calendars")
  if (!accountId) throw new Error("No calendar account available.")
  client.calendar.bindAccount(accountId)
  await client.calendar.destroyEvent(id, accountId)
}

export async function importEvents(
  events: Partial<CalendarEvent>[],
  calendarId: string,
  onProgress?: (done: number) => void
): Promise<{ imported: number; skipped: number; failed: number }> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId("urn:ietf:params:jmap:calendars")
  if (!accountId) throw new Error("No calendar account available.")
  client.calendar.bindAccount(accountId)
  let imported = 0,
    skipped = 0,
    failed = 0
  for (let offset = 0; offset < events.length; offset += 50) {
    const batch = events.slice(offset, offset + 50)
    const uids = batch
      .map((event) => event.uid)
      .filter((uid): uid is string => !!uid)
    const existing = await client.calendar.queryEvents(
      { anyOf: uids.map((uid) => ({ uid })) },
      { limit: 250 },
      accountId
    )
    const existingEvents = existing.ids.length
      ? await client.calendar.getEventsByIds(existing.ids, accountId)
      : []
    const seen = new Set(
      existingEvents
        .filter(
          (event) =>
            event.calendarId === calendarId || event.calendarIds?.[calendarId]
        )
        .map((event) => event.uid)
    )
    const fresh = batch.filter((event) => !event.uid || !seen.has(event.uid))
    skipped += batch.length - fresh.length
    if (fresh.length) {
      const result = await client.calendar.applyMutations(
        {
          create: fresh.map((event) => ({
            ...event,
            calendarId,
            calendarIds: { [calendarId]: true },
            participants: undefined,
            attendees: undefined,
            alerts: undefined,
            reminders: undefined,
          })),
        },
        {},
        accountId
      )
      imported += Object.keys(result.created ?? {}).length
      failed +=
        Object.keys(result.notCreated ?? {}).length +
        Math.max(
          0,
          fresh.length -
            Object.keys(result.created ?? {}).length -
            Object.keys(result.notCreated ?? {}).length
        )
    }
    onProgress?.(Math.min(offset + 50, events.length))
  }
  return { imported, skipped, failed }
}

export async function parseIcsContents(
  contents: string
): Promise<ParsedCalendarFile> {
  if (contents.length > 10_000_000) throw new Error("File exceeds 10 MB.")
  if (!isDemoRuntime) {
    try {
      const client = await getJmapClient()
      const session = await client.session()
      const accountId = await getPrimaryAccountId(JMAP_CAPS.CALENDARS)
      if (
        accountId &&
        session.capabilities["urn:ietf:params:jmap:calendars:parse"]
      ) {
        const data = new TextEncoder().encode(contents)
        const blob = await client.upload(accountId, data.buffer, {
          contentType: "text/calendar",
          filename: "import.ics",
        })
        const response = await client.call<{
          parsed?: Record<string, Partial<CalendarEvent>[]>
          notParsable?: string[]
        }>(
          "CalendarEvent/parse",
          { accountId, blobIds: [blob.blobId] },
          "icsparse"
        )
        if (response.notParsable?.length)
          throw new Error("Stalwart could not parse this calendar file.")
        return { events: response.parsed?.[blob.blobId] ?? [], errors: [] }
      }
    } catch {
      // Stalwart's upload/parser is unavailable (e.g. 404 on this server
      // version); fall back to parsing the file locally so import still works.
    }
  }
  return parseCalendarFile(contents)
}
