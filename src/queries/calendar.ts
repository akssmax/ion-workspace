/**
 * Calendar React Query hooks.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as calendarService from "../services/calendar/calendar.service"
import {
  addDaysDelta,
  monthBounds,
  startOfDayDate,
  toJmapInstant,
} from "../lib/dates"
import { qk } from "./keys"
import type { JmapId } from "../jmap/types/calendar"

export function useCalendars() {
  return useQuery({
    queryKey: qk.calendars(),
    queryFn: () => calendarService.getCalendars(),
    staleTime: 60_000,
  })
}

export function useCreateCalendar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; color?: string }) =>
      calendarService.createCalendar(data.name, data.color),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.calendars() }),
  })
}

export function useCalendarCapabilities() {
  return useQuery({
    queryKey: ["acc", "calendar-capabilities"],
    queryFn: () => calendarService.getCalendarCapabilities(),
    staleTime: 5 * 60_000,
    retry: false,
  })
}

export function useEventsForMonth(month: Date) {
  const { start, end } = monthBounds(month)
  return useQuery({
    queryKey: qk.events("all", start.toISOString(), end.toISOString()),
    queryFn: () =>
      calendarService.getEventsInRange(start.toISOString(), end.toISOString()),
    staleTime: 60_000,
  })
}

export function useCalendarEvents(input: {
  start: Date
  end: Date
  calendarIds?: string[]
  timeZone: string
}) {
  const start = input.start.toISOString()
  const end = input.end.toISOString()
  const ids = input.calendarIds?.slice().sort().join(",") ?? "all"
  return useQuery({
    queryKey: [...qk.events(ids, start, end), input.timeZone],
    queryFn: () => calendarService.getEventsInRange(start, end, { calendarIds: input.calendarIds, timeZone: input.timeZone }),
    select: (events) =>
      input.calendarIds
        ? events.filter((event) =>
            input.calendarIds!.includes(
              event.calendarId ?? Object.keys(event.calendarIds ?? {})[0]
            )
          )
        : events,
    staleTime: 30_000,
    refetchInterval: 60_000,
    meta: { timeZone: input.timeZone },
  })
}

/** Events from the start of today through the next `horizonDays` days. */
export function useUpcomingEvents(horizonDays = 7) {
  const start = startOfDayDate(new Date())
  const end = addDaysDelta(start, horizonDays + 1)
  return useQuery({
    queryKey: qk.events("all", start.toISOString(), end.toISOString()),
    queryFn: () =>
      calendarService.getEventsInRange(start.toISOString(), end.toISOString()),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      event,
      sendInvitations = true,
    }: {
      event: Parameters<typeof calendarService.createEvent>[0]
      sendInvitations?: boolean
    }) => calendarService.createEvent(event, sendInvitations),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["acc", "events"] }),
  })
}

export function useUpdateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      patch,
      sendInvitations = true,
    }: {
      id: JmapId
      patch: Parameters<typeof calendarService.updateEvent>[1]
      sendInvitations?: boolean
    }) => calendarService.updateEvent(id, patch, sendInvitations),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["acc", "events"] }),
  })
}

export function useDestroyEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: JmapId) => calendarService.destroyEvent(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["acc", "events"] }),
  })
}

export { toJmapInstant }
