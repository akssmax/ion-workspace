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

export function useEventsForMonth(month: Date) {
  const { start, end } = monthBounds(month)
  return useQuery({
    queryKey: qk.events("all", start.toISOString(), end.toISOString()),
    queryFn: () =>
      calendarService.getEventsInRange(start.toISOString(), end.toISOString()),
    staleTime: 60_000,
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
    mutationFn: (event: Parameters<typeof calendarService.createEvent>[0]) =>
      calendarService.createEvent(event),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["acc", "events"] }),
  })
}

export function useUpdateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: JmapId
      patch: Parameters<typeof calendarService.updateEvent>[1]
    }) => calendarService.updateEvent(id, patch),
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
