/**
 * Calendar domain service.
 */

import type { Calendar, CalendarEvent, JmapId } from "../../jmap/types/calendar"
import { getJmapClient, getPrimaryAccountId } from "../jmap.service"

export async function getCalendars(): Promise<Calendar[]> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId("urn:ietf:params:jmap:calendars")
  if (!accountId) return []
  client.calendar.bindAccount(accountId)
  return client.calendar.getCalendars(accountId)
}

export async function getEventsInRange(
  start: string,
  end: string
): Promise<CalendarEvent[]> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId("urn:ietf:params:jmap:calendars")
  if (!accountId) return []
  client.calendar.bindAccount(accountId)
  return client.calendar.getEventsInRange(start, end, {}, accountId)
}

export async function createEvent(
  event: Partial<CalendarEvent>
): Promise<string> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId("urn:ietf:params:jmap:calendars")
  if (!accountId) throw new Error("No calendar account available.")
  client.calendar.bindAccount(accountId)
  return client.calendar.createEvent(event, accountId)
}

export async function updateEvent(
  id: JmapId,
  patch: Partial<Record<string, unknown>>
): Promise<void> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId("urn:ietf:params:jmap:calendars")
  if (!accountId) return
  client.calendar.bindAccount(accountId)
  await client.calendar.updateEvent(id, patch, accountId)
}

export async function destroyEvent(id: JmapId): Promise<void> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId("urn:ietf:params:jmap:calendars")
  if (!accountId) return
  client.calendar.bindAccount(accountId)
  await client.calendar.destroyEvent(id, accountId)
}
