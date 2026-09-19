/**
 * Calendar UI state (Zustand): the viewport pivot and layout mode.
 */

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { workspaceStorage } from "@/lib/demo/runtime"
import { startOfDay } from "date-fns"
import { coerceDate } from "@/lib/dates"

export type CalendarView = "month" | "week" | "day" | "agenda"

const CALENDAR_VIEWS: readonly string[] = ["month", "week", "day", "agenda"]

function isCalendarView(value: unknown): value is CalendarView {
  return typeof value === "string" && CALENDAR_VIEWS.includes(value)
}

interface CalendarState {
  view: CalendarView
  cursor: Date // day shown as active / week pivot
  selectedEventId: string | null
  setView: (view: CalendarView) => void
  setCursor: (date: Date) => void
  goToday: () => void
  step: (dir: 1 | -1) => void
  setSelectedEvent: (id: string | null) => void
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      view: "month",
      cursor: startOfDay(new Date()),
      selectedEventId: null,
      setView: (view) => set({ view }),
      setCursor: (cursor) => {
        const date = coerceDate(cursor) ?? new Date()
        set({ cursor: startOfDay(date) })
      },
      goToday: () => set({ cursor: startOfDay(new Date()) }),
      step: (dir) =>
        set((s) => {
          const next = new Date(s.cursor)
          if (s.view === "month") next.setMonth(next.getMonth() + dir)
          else next.setDate(next.getDate() + dir)
          return { cursor: startOfDay(next) }
        }),
      setSelectedEvent: (selectedEventId) => set({ selectedEventId }),
    }),
    {
      name: "workspace-calendar",
      storage: createJSONStorage(workspaceStorage),
      version: 1,
      // `cursor` is a Date in memory but JSON persistence rehydrates it as
      // an ISO string (or garbage from older/corrupt payloads). Revive it
      // here so the store invariant (`cursor: Date`) always holds and views
      // never crash on `cursor.getFullYear is not a function`.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<CalendarState>
        return {
          ...current,
          ...saved,
          view: isCalendarView(saved.view) ? saved.view : current.view,
          cursor: coerceDate(saved.cursor) ?? current.cursor,
        }
      },
    }
  )
)
