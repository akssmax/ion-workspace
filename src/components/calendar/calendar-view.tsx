/**
 * Calendar: equal month-grid cells, with new events and event details
 * in a right-side sheet.
 */

import { useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  Trash2,
  Clock,
} from "lucide-react"
import { cn } from "cn"
import { useCalendarStore } from "@/stores/calendar.store"
import {
  useCalendars,
  useEventsForMonth,
  useCreateEvent,
  useDestroyEvent,
  toJmapInstant,
} from "@/queries/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatDate, toDate, addDaysDelta, isSameMonthWith } from "@/lib/dates"
import { CalendarEventChip } from "@/components/calendar/event-chip"
import type { CalendarEvent } from "@/jmap/types/calendar"
import { OpenSidebarTrigger } from "@/components/shell/open-sidebar-trigger"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const DURATIONS = [
  { value: "PT30M", label: "30 minutes" },
  { value: "PT1H", label: "1 hour" },
  { value: "PT2H", label: "2 hours" },
  { value: "P1D", label: "All day" },
]

export function CalendarView() {
  const cursor = useCalendarStore((s) => s.cursor)
  const setCursor = useCalendarStore((s) => s.setCursor)
  const goToday = useCalendarStore((s) => s.goToday)
  const step = useCalendarStore((s) => s.step)
  const selectedEventId = useCalendarStore((s) => s.selectedEventId)
  const setSelectedEvent = useCalendarStore((s) => s.setSelectedEvent)

  const { data: events } = useEventsForMonth(cursor)
  const { data: calendars } = useCalendars()
  const createEvent = useCreateEvent()
  const destroyEvent = useDestroyEvent()

  const calById = useMemo(() => {
    const map = new Map<string, { name: string; color?: string | null }>()
    for (const c of calendars ?? [])
      map.set(c.id, { name: c.name, color: c.color })
    return map
  }, [calendars])

  const days = useMemo(() => buildMonthGrid(cursor).flat(), [cursor])
  const eventsByDay = useMemo(
    () => groupByDay(events ?? [], cursor),
    [events, cursor]
  )

  const selected = (events ?? []).find((e) => e.id === selectedEventId) ?? null
  const defaultCalId = calendars?.[0]?.id

  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newTime, setNewTime] = useState("09:00")
  const [newDuration, setNewDuration] = useState("PT1H")
  const [newNotes, setNewNotes] = useState("")

  const sheetOpen = adding || !!selected

  function closeSheet() {
    setAdding(false)
    setSelectedEvent(null)
    setNewTitle("")
    setNewNotes("")
    setNewTime("09:00")
    setNewDuration("PT1H")
  }

  function openNewEvent(day?: Date) {
    if (day) setCursor(day)
    setSelectedEvent(null)
    setNewTitle("")
    setNewNotes("")
    setAdding(true)
  }

  async function addEvent() {
    if (!newTitle.trim() || !defaultCalId) return
    const allDay = newDuration === "P1D"
    const start = allDay
      ? startOfLocalDay(cursor)
      : startFromDayAndTime(cursor, newTime)
    await createEvent.mutateAsync({
      calendarId: defaultCalId,
      title: newTitle.trim(),
      description: newNotes.trim() || null,
      start: toJmapInstant(start),
      duration: newDuration,
      showWithoutTime: allDay,
      allDay,
      freeBusyStatus: "BUSY",
    })
    closeSheet()
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-1 border-b px-2 py-2 sm:gap-2 sm:px-4">
        <OpenSidebarTrigger />
        <Button variant="outline" size="sm" onClick={goToday}>
          Today
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => step(-1)}
          aria-label="Previous"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => step(1)}
          aria-label="Next"
        >
          <ChevronRight className="size-4" />
        </Button>
        <h1 className="min-w-0 truncate text-sm font-semibold sm:ml-2 sm:text-base">
          {formatDate(cursor, "MMMM yyyy")}
        </h1>
        <Button
          className="ml-auto"
          size="sm"
          onClick={() => openNewEvent()}
          aria-label="New event"
        >
          <CalendarPlus className="size-4" />
          <span className="hidden sm:inline">New event</span>
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-x-auto">
      <div className="grid h-full min-w-[560px] grid-cols-[repeat(7,minmax(0,1fr))] grid-rows-[auto_repeat(6,minmax(0,1fr))] gap-px bg-border sm:min-w-0">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="bg-muted/30 px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
            const dayEvents = eventsByDay.get(dayKey(day)) ?? []
            const inMonth = isSameMonthWith(day, cursor)
            const isToday = dayKey(day) === dayKey(new Date())
            const isCursor = dayKey(day) === dayKey(cursor)
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => openNewEvent(day)}
                className={cn(
                  "group flex min-h-0 min-w-0 flex-col gap-1 overflow-hidden bg-background p-1.5 text-left align-top transition-colors hover:bg-muted/40",
                  !inMonth && "bg-muted/15 text-muted-foreground",
                  isCursor && adding && "ring-1 ring-inset ring-ring"
                )}
              >
                <div className="flex shrink-0 items-center justify-between">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                      isToday &&
                        "bg-primary font-semibold text-primary-foreground"
                    )}
                  >
                    {formatDate(day, "d")}
                  </span>
                  <CalendarPlus className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </div>
                <div className="min-h-0 flex-1 space-y-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map((ev) => {
                    const cal = calById.get(ev.calendarId)
                    return (
                      <CalendarEventChip
                        key={ev.id}
                        title={ev.title || "(no title)"}
                        color={cal?.color}
                        fallbackKey={ev.calendarId}
                        selected={ev.id === selectedEventId}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedEvent(
                            ev.id === selectedEventId ? null : ev.id
                          )
                          setAdding(false)
                        }}
                      />
                    )
                  })}
                  {dayEvents.length > 3 ? (
                    <span className="px-1.5 text-[10px] text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </span>
                  ) : null}
                </div>
              </button>
            )
          })}
      </div>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) closeSheet()
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-md data-[side=right]:sm:max-w-md"
        >
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>{selected.title || "(no title)"}</SheetTitle>
                <SheetDescription>
                  {formatEventTime(selected)} ·{" "}
                  {calById.get(selected.calendarId)?.name ?? "Calendar"}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-4 px-6">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  {formatEventTime(selected)}
                </p>
                {selected.description ? (
                  <p className="text-sm leading-relaxed">
                    {selected.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No description.
                  </p>
                )}
              </div>
              <SheetFooter>
                <Button
                  variant="outline"
                  onClick={() =>
                    openNewEvent(toDate(selected.start))
                  }
                >
                  <CalendarPlus className="size-4" />
                  New event
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await destroyEvent.mutateAsync(selected.id)
                    closeSheet()
                  }}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </SheetFooter>
            </>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle>New event</SheetTitle>
                <SheetDescription>
                  {formatDate(cursor, "EEEE, MMMM d")}
                </SheetDescription>
              </SheetHeader>
              <form
                className="flex min-h-0 flex-1 flex-col"
                onSubmit={(e) => {
                  e.preventDefault()
                  void addEvent()
                }}
              >
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6">
                  <div className="space-y-2">
                    <Label htmlFor="new-event-title">Title</Label>
                    <Input
                      id="new-event-title"
                      autoFocus
                      placeholder="Event title…"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="new-event-time">Time</Label>
                      <Input
                        id="new-event-time"
                        type="time"
                        value={newTime}
                        disabled={newDuration === "P1D"}
                        onChange={(e) => setNewTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-event-duration">Duration</Label>
                      <Select
                        value={newDuration}
                        onValueChange={(value) => {
                          if (typeof value === "string") setNewDuration(value)
                        }}
                      >
                        <SelectTrigger
                          id="new-event-duration"
                          className="w-full"
                        >
                          <SelectValue>
                            {DURATIONS.find((d) => d.value === newDuration)
                              ?.label ?? "Duration"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {DURATIONS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-event-notes">Notes</Label>
                    <Textarea
                      id="new-event-notes"
                      placeholder="Optional details…"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                    />
                  </div>
                </div>
                <SheetFooter>
                  <Button type="button" variant="ghost" onClick={closeSheet}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      !newTitle.trim() ||
                      !defaultCalId ||
                      createEvent.isPending
                    }
                  >
                    {createEvent.isPending ? "Adding…" : "Add event"}
                  </Button>
                </SheetFooter>
              </form>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function buildMonthGrid(cursor: Date): Date[][] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const start = addDaysDelta(first, -first.getDay())
  const weeks: Date[][] = []
  for (let w = 0; w < 6; w++) {
    const row: Date[] = []
    for (let d = 0; d < 7; d++) {
      row.push(addDaysDelta(start, w * 7 + d))
    }
    weeks.push(row)
  }
  return weeks
}

function groupByDay(
  events: CalendarEvent[],
  cursor: Date
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>()
  for (const week of buildMonthGrid(cursor)) {
    for (const day of week) map.set(dayKey(day), [])
  }
  for (const ev of events) {
    const key = dayKey(toDate(ev.start))
    const bucket = map.get(key) ?? []
    bucket.push(ev)
    map.set(key, bucket)
  }
  for (const bucket of map.values()) {
    bucket.sort((a, b) => a.start.localeCompare(b.start))
  }
  return map
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function startOfLocalDay(day: Date): Date {
  const d = new Date(day)
  d.setHours(0, 0, 0, 0)
  return d
}

function startFromDayAndTime(day: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map((n) => Number(n) || 0)
  const d = new Date(day)
  d.setHours(hours, minutes, 0, 0)
  return d
}

function formatEventTime(ev: CalendarEvent): string {
  const start = toDate(ev.start)
  if (ev.allDay || ev.showWithoutTime) return formatDate(start, "EEE, MMM d")
  return formatDate(start, "EEE, MMM d · HH:mm")
}
