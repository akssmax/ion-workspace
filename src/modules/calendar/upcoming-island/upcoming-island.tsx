/**
 * Upcoming events island — compact pill on the right of mail search that
 * expands into a short agenda (Dynamic Island–style).
 */

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Video } from "lucide-react"
import { format, formatDistanceToNowStrict, isToday } from "date-fns"
import { useUpcomingEvents } from "@/queries/calendar"
import { useCalendarFeeds } from "@/queries/calendar-feeds"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useCalendarStore } from "@/stores/calendar.store"
import { useSidebar } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { CalendarEvent } from "@/jmap/types/calendar"
import { eventKind, eventPhase } from "./island-style"
import { eventEnd, eventStart } from "@/lib/calendar-event"

const SOON_LIMIT = 5

export function UpcomingIsland() {
  const eventsQuery = useUpcomingEvents()
  const feeds = useCalendarFeeds()
  const setApp = useWorkspaceStore((s) => s.setApp)
  const setCursor = useCalendarStore((s) => s.setCursor)
  const setView = useCalendarStore((s) => s.setView)
  const setSelectedEvent = useCalendarStore((s) => s.setSelectedEvent)
  const { setOpen: setSidebarOpen } = useSidebar()
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const upcoming = useMemo(() => {
    const feedEvents = (feeds.data ?? []).flatMap((feed) =>
      feed.events.map(
        (event, index) =>
          ({
            ...event,
            id: `feed:${feed.id}:${index}`,
            uid: event.uid ?? `feed-${index}`,
            calendarId: `feed:${feed.id}`,
            title: event.title ?? "(untitled)",
            start: event.start ?? "",
            duration: event.duration ?? "PT1H",
          })
      )
    )
    const rows = [...(eventsQuery.data ?? []), ...feedEvents]
    return rows
      .filter((event) => eventEnd(event).getTime() > now.getTime())
      .sort((a, b) => eventStart(a).getTime() - eventStart(b).getTime())
      .slice(0, SOON_LIMIT)
  }, [eventsQuery.data, feeds.data, now])

  const next = upcoming.at(0)
  const phase = next ? eventPhase(next, now) : "later"
  const loading = (eventsQuery.isLoading || feeds.isLoading) && !next

  function openCalendar(event: CalendarEvent) {
    setSelectedEvent(event.id)
    setCursor(eventStart(event))
    setView("day")
    setApp("calendar")
    setSidebarOpen(true)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={
              loading
                ? "Loading upcoming events"
                : next
                  ? `${phaseLabel(phase)}: ${next.title ?? "Event"}`
                  : "No upcoming events"
            }
            className="flex h-8 max-w-56 shrink-0 items-center gap-2 rounded-full border bg-muted px-2.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-accent"
          />
        }
      >
        {next && eventKind(next) === "meeting" ? (
          <Video className="size-3.5 shrink-0" />
        ) : (
          <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        {loading ? (
          <Spinner className="size-3.5" />
        ) : next ? (
          <>
            <span className="min-w-0 truncate">{next.title ?? "Upcoming"}</span>
            <span className="shrink-0 opacity-80">
              {compactWhen(next, phase)}
            </span>
          </>
        ) : (
          <span className="min-w-0 truncate text-muted-foreground">
            No upcoming events
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-72 gap-1 rounded-xl bg-popover p-2 text-popover-foreground shadow-lg"
      >
        <p className="px-2 pt-1 pb-1.5 text-[10px] font-semibold tracking-wide uppercase opacity-70">
          Upcoming
        </p>
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-2 py-4 text-xs text-muted-foreground">
            <Spinner /> Loading…
          </div>
        ) : upcoming.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-2 py-4 text-center">
            <CalendarDays className="size-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No upcoming events</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {upcoming.map((event) => {
              const rowPhase = eventPhase(event, now)
              const kind = eventKind(event)
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => openCalendar(event)}
                    className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent"
                  >
                    {kind === "meeting" ? (
                      <Video className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <CalendarDays className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {event.title || "(no title)"}
                        </span>
                        <span className="shrink-0 text-[11px] opacity-80">
                          {compactWhen(event, rowPhase)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] opacity-70">
                        {kind === "meeting" ? (
                          <Video className="size-3" />
                        ) : (
                          <CalendarDays className="size-3" />
                        )}
                        <span className="truncate">
                          {event.location ||
                            format(eventStart(event), "EEEE p")}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}

function phaseLabel(phase: "live" | "soon" | "later"): string {
  if (phase === "live") return "Live"
  if (phase === "soon") return "Starting soon"
  return "Upcoming"
}

function compactWhen(
  event: CalendarEvent,
  phase: "live" | "soon" | "later"
): string {
  if (phase === "live") return "Now"
  const start = eventStart(event)
  if (phase === "soon") {
    return formatDistanceToNowStrict(start, { addSuffix: false })
      .replace(" minutes", "m")
      .replace(" minute", "m")
      .replace(" seconds", "s")
      .replace(" second", "s")
  }
  if (isToday(start)) return format(start, "p")
  return format(start, "EEE p")
}
