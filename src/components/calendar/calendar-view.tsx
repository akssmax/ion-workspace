import { Suspense, useEffect, useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  Upload,
  RefreshCw,
  ListFilter,
} from "lucide-react"
import {
  addDays,
  endOfMonth,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import {
  useCalendarStore,
  type CalendarView as View,
} from "@/stores/calendar.store"
import {
  useCalendars,
  useCalendarEvents,
  useCalendarCapabilities,
} from "@/queries/calendar"
import { usePreferences } from "@/queries/preferences"
import { OpenSidebarTrigger } from "@/components/shell/open-sidebar-trigger"
import { SettingsButton } from "@/components/shell/settings-button"
import { MobileFab } from "@/components/shell/mobile-fab"
import { ThemeMenu } from "@/components/theme/theme-menu"
import { lazyWithRetry } from "@/lib/lazy-with-retry"
import { EventEditor, emptyDraft } from "./event-editor"
import { eventCalendarId, type CalendarDraft } from "@/lib/calendar-event"
import type { CalendarEvent } from "@/jmap/types/calendar"
import { CalendarImport } from "./calendar-import"
import { useCalendarFeeds } from "@/queries/calendar-feeds"
import { CalendarList } from "./calendar-list"
import { CalendarMiniPicker } from "./calendar-mini-picker"
import { calendarWeekStart } from "@/lib/calendar-week-start"

const CalendarCanvas = lazyWithRetry(() => import("./calendar-canvas"))
const VIEW_NAMES: Record<View, string> = {
  month: "Month",
  week: "Week",
  day: "Day",
  agenda: "Schedule",
}

function windowFor(date: Date, view: View, weekStartsOn: number, scheduleDays: number) {
  if (view === "month") {
    const start = startOfWeek(startOfMonth(date), { weekStartsOn: weekStartsOn as 0 | 1 | 6 })
    return { start, end: addDays(startOfWeek(endOfMonth(date), { weekStartsOn: weekStartsOn as 0 | 1 | 6 }), 7) }
  }
  if (view === "week") {
    const start = startOfWeek(date, { weekStartsOn: weekStartsOn as 0 | 1 | 6 })
    return { start, end: addDays(start, 7) }
  }
  if (view === "day") {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return { start, end: addDays(start, 1) }
  }
  return { start: date, end: addDays(date, scheduleDays) }
}

export function CalendarView() {
  const desktopView = useCalendarStore((state) => state.view)
  const mobileView = useCalendarStore((state) => state.mobileView)
  const cursor = useCalendarStore((state) => state.cursor)
  const setCursor = useCalendarStore((state) => state.setCursor)
  const goToday = useCalendarStore((state) => state.goToday)
  const setView = useCalendarStore((state) => state.setView)
  const setMobileView = useCalendarStore((state) => state.setMobileView)
  const [mobile, setMobile] = useState(false)
  const [editorEvent, setEditorEvent] = useState<CalendarEvent | null>(null)
  const [initialDraft, setInitialDraft] = useState<CalendarDraft | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [showCalendars, setShowCalendars] = useState(false)
  const hidden = useCalendarStore((state) => state.hiddenCalendarIds)
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())
  const [visibleRange, setVisibleRange] = useState<{
    start: Date
    end: Date
  } | null>(null)
  const [scheduleDays, setScheduleDays] = useState(30)
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)")
    const sync = () => setMobile(query.matches)
    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])
  const view = mobile ? mobileView : desktopView
  const prefs = usePreferences().data
  const language = prefs?.language ?? "en"
  const weekStartsOn = calendarWeekStart(language, prefs?.calendarWeekStart)
  const timeZone =
    prefs?.timezone && prefs.timezone !== "auto"
      ? prefs.timezone
      : Intl.DateTimeFormat().resolvedOptions().timeZone
  const computed = useMemo(() => windowFor(cursor, view, weekStartsOn, scheduleDays), [cursor, view, weekStartsOn, scheduleDays])
  const range = visibleRange ?? computed
  const calendars = useCalendars()
  const capabilities = useCalendarCapabilities()
  const events = useCalendarEvents({ ...range, timeZone })
  const feeds = useCalendarFeeds()
  const visibleEvents = useMemo(
    () =>
      [
        ...(events.data ?? []),
        ...(feeds.data ?? []).flatMap((feed) =>
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
              }) as CalendarEvent
          )
        ),
      ].filter((event) => !hidden.includes(eventCalendarId(event))),
    [events.data, feeds.data, hidden]
  )
  const writable = calendars.data?.find(
    (calendar) =>
      !calendar.isReadOnly && calendar.myRights?.mayAddItems !== false
  )
  const available = Boolean(calendars.data?.length || feeds.data?.length)
  function openNew(start = new Date(), end?: Date, allDay = false) {
    if (!end && !allDay)
      start = new Date(Math.ceil(start.getTime() / 1_800_000) * 1_800_000)
    if (!writable) return
    const next = emptyDraft(start, writable.id, timeZone)
    if (end) next.end = format(end, "yyyy-MM-dd'T'HH:mm")
    next.allDay = allDay
    setEditorEvent(null)
    setInitialDraft(next)
  }
  function navigate(direction: -1 | 1) {
    setScheduleDays(30)
    const next = new Date(cursor)
    if (view === "month") {
      const day = next.getDate()
      next.setDate(1)
      next.setMonth(next.getMonth() + direction)
      next.setDate(
        Math.min(
          day,
          new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
        )
      )
    } else
      next.setDate(
        next.getDate() +
          direction * (view === "week" ? 7 : view === "agenda" ? 30 : 1)
      )
    setVisibleRange(null)
    setCursor(next)
  }
  const title =
    view === "month"
      ? format(cursor, "MMMM yyyy")
      : view === "day"
        ? format(cursor, "EEEE, MMMM d")
        : `${format(computed.start, "MMM d")} – ${format(addDays(computed.end, -1), "MMM d, yyyy")}`
  useEffect(() => setVisibleRange(null), [cursor])
  return (
    <div className="flex h-full min-w-0 flex-col bg-background">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 sm:px-4 md:h-14 md:py-0">
        <OpenSidebarTrigger />
        <Sheet open={showCalendars} onOpenChange={setShowCalendars}>
          <SheetTrigger render={<Button className="md:hidden" variant="outline" size="icon-sm" aria-label="Calendars" />}>
            <ListFilter className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(88vw,22rem)]">
            <SheetHeader><SheetTitle>Calendars</SheetTitle></SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-3"><CalendarMiniPicker /><CalendarList /></div>
          </SheetContent>
        </Sheet>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setVisibleRange(null)
            goToday()
          }}
        >
          Today
        </Button>
        <div className="flex">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous period"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next period"
            onClick={() => navigate(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <h1 className="min-w-max flex-1 text-sm font-semibold sm:text-base">
          {title}
        </h1>
        <SettingsButton />
        <ThemeMenu />
        <Separator
          orientation="vertical"
          className="mx-1 h-6 self-center!"
        />
        <Tabs
          value={view}
          onValueChange={(next) => {
            setVisibleRange(null)
            if (mobile) setMobileView(next as View)
            else setView(next as View)
          }}
        >
          <TabsList aria-label="Calendar view" className="border bg-muted/40">
            {(Object.keys(VIEW_NAMES) as View[]).map((key) => (
              <TabsTrigger key={key} value={key} className="px-2.5 text-xs sm:text-sm">
                {VIEW_NAMES[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
          <Upload className="size-4" />
          <span className="hidden sm:inline">Import</span>
        </Button>
        <Button size="sm" disabled={!writable} onClick={() => openNew()}>
          <CalendarPlus className="size-4" />
          <span className="hidden sm:inline">Create event</span>
        </Button>
      </header>
      {calendars.isLoading || capabilities.isLoading ? (
        <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Spinner /> Loading calendars…
        </div>
      ) : calendars.isError || capabilities.isError ? (
        <div role="alert" className="p-6 text-sm text-destructive">
          Could not load calendar capabilities.{" "}
          <Button
            variant="outline"
            onClick={() => {
              void calendars.refetch()
              void capabilities.refetch()
            }}
          >
            Retry
          </Button>
        </div>
      ) : !capabilities.data?.available || !available ? (
        <div className="m-auto max-w-sm p-6 text-center">
          <h2 className="font-semibold">Calendar unavailable</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account has no calendar available. Check the calendar
            capability and account permissions on Stalwart.
          </p>
        </div>
      ) : (
        <>
          {events.isError && (
            <div
              role="alert"
              className="flex items-center gap-2 border-b p-3 text-sm text-destructive"
            >
              Could not load events.{" "}
              <Button
                variant="outline"
                size="sm"
                onClick={() => void events.refetch()}
              >
                <RefreshCw className="size-3" /> Retry
              </Button>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-auto">
            <Suspense
              fallback={
                <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                  <Spinner /> Loading calendar…
                </div>
              }
            >
              <CalendarCanvas
                view={view}
                cursor={cursor}
                events={visibleEvents}
                calendars={[
                  ...(calendars.data ?? []),
                  ...(feeds.data ?? []).map((feed) => ({
                    id: `feed:${feed.id}`,
                    name: feed.name,
                    color: feed.color,
                    isReadOnly: true,
                  })),
                ]}
                timeZone={timeZone}
                language={language}
                weekStartsOn={weekStartsOn}
                scheduleDays={scheduleDays}
                onRange={setVisibleRange}
                onCreate={openNew}
                onDay={mobile ? setSelectedDay : undefined}
                onEvent={(event) => {
                  setInitialDraft(null)
                  setEditorEvent(event)
                }}
              />
            </Suspense>
            {view === "agenda" && <div className="flex justify-center border-t p-2"><Button variant="outline" onClick={() => { setVisibleRange(null); setScheduleDays((days) => days + 30) }}>Load 30 more days</Button></div>}
            {mobile && view === "month" && (
              <div className="border-t p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">
                    {format(selectedDay, "EEEE, MMMM d")}
                  </h2>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openNew(selectedDay)}
                  >
                    Add event
                  </Button>
                </div>
                {visibleEvents.filter(
                  (event) =>
                    event.start.slice(0, 10) ===
                    format(selectedDay, "yyyy-MM-dd")
                ).length ? (
                  visibleEvents
                    .filter(
                      (event) =>
                        event.start.slice(0, 10) ===
                        format(selectedDay, "yyyy-MM-dd")
                    )
                    .map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        className="block min-h-11 w-full border-b py-2 text-left text-sm"
                        onClick={() => setEditorEvent(event)}
                      >
                        {event.title}
                      </button>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground">No events</p>
                )}
              </div>
            )}
          </div>
        </>
      )}
      <EventEditor
        event={editorEvent}
        initial={initialDraft}
        calendars={[
          ...(calendars.data ?? []),
          ...(feeds.data ?? []).map((feed) => ({
            id: `feed:${feed.id}`,
            name: feed.name,
            color: feed.color,
            isReadOnly: true,
          })),
        ]}
        onClose={() => {
          setEditorEvent(null)
          setInitialDraft(null)
        }}
      />
      <CalendarImport
        open={showImport}
        onClose={() => setShowImport(false)}
        calendars={calendars.data ?? []}
      />
      <MobileFab
        icon={CalendarPlus}
        label="New event"
        disabled={!writable}
        onClick={() => openNew()}
      />
    </div>
  )
}
