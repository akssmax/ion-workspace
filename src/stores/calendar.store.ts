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
  mobileView: CalendarView
  cursor: Date // day shown as active / week pivot
  selectedEventId: string | null
  hiddenCalendarIds: string[]
  setView: (view: CalendarView) => void
  setMobileView: (view: CalendarView) => void
  setCursor: (date: Date) => void
  goToday: () => void
  step: (dir: 1 | -1) => void
  setSelectedEvent: (id: string | null) => void
  setCalendarVisible: (id: string, visible: boolean) => void
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      view: "month",
      mobileView: "agenda",
      cursor: startOfDay(new Date()),
      selectedEventId: null,
      hiddenCalendarIds: [],
      setView: (view) => set({ view }),
      setMobileView: (mobileView) => set({ mobileView }),
      setCursor: (cursor) => {
        const date = coerceDate(cursor) ?? new Date()
        set({ cursor: startOfDay(date) })
      },
      goToday: () => set({ cursor: startOfDay(new Date()) }),
      step: (dir) =>
        set((s) => {
          const next = new Date(s.cursor)
          if (s.view === "month") {
            const day = next.getDate()
            next.setDate(1)
            next.setMonth(next.getMonth() + dir)
            next.setDate(
              Math.min(
                day,
                new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
              )
            )
          } else
            next.setDate(
              next.getDate() +
                dir * (s.view === "week" ? 7 : s.view === "agenda" ? 30 : 1)
            )
          return { cursor: startOfDay(next) }
        }),
      setSelectedEvent: (selectedEventId) => set({ selectedEventId }),
      setCalendarVisible: (id, visible) =>
        set((state) => ({
          hiddenCalendarIds: visible
            ? state.hiddenCalendarIds.filter((item) => item !== id)
            : state.hiddenCalendarIds.includes(id)
              ? state.hiddenCalendarIds
              : [...state.hiddenCalendarIds, id],
        })),
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
          mobileView: isCalendarView(saved.mobileView)
            ? saved.mobileView
            : current.mobileView,
          cursor: coerceDate(saved.cursor) ?? current.cursor,
          hiddenCalendarIds: Array.isArray(saved.hiddenCalendarIds)
            ? saved.hiddenCalendarIds.filter((id): id is string => typeof id === "string")
            : [],
        }
      },
    }
  )
)
