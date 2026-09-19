import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/react/daygrid"
import timeGridPlugin from "@fullcalendar/react/timegrid"
import listPlugin from "@fullcalendar/react/list"
import interactionPlugin from "@fullcalendar/react/interaction"
import classicThemePlugin from "@fullcalendar/react/themes/classic"
import "@fullcalendar/react/skeleton.css"
import "@fullcalendar/react/themes/classic/theme.css"
import "./calendar.css"
import {
  draftFromEvent,
  draftToEvent,
  eventCalendarId,
  eventEnd,
  eventLocation,
  eventStart,
  isAllDay,
  localInput,
} from "@/lib/calendar-event"
import { useUpdateEvent } from "@/queries/calendar"
import type { Calendar, CalendarEvent } from "@/jmap/types/calendar"
import type { CalendarView } from "@/stores/calendar.store"
import { CalendarEventChip } from "./event-chip"

const viewName: Record<CalendarView, string> = {
  month: "dayGridMonth",
  week: "timeGridWeek",
  day: "timeGridDay",
  agenda: "list30",
}

export default function CalendarCanvas({
  view,
  cursor,
  events,
  calendars,
  timeZone,
  language,
  weekStartsOn,
  scheduleDays,
  onRange,
  onCreate,
  onDay,
  onEvent,
}: {
  view: CalendarView
  cursor: Date
  events: CalendarEvent[]
  calendars: Calendar[]
  timeZone: string
  language: string
  weekStartsOn: number
  scheduleDays: number
  onRange: (value: { start: Date; end: Date }) => void
  onCreate: (start?: Date, end?: Date, allDay?: boolean) => void
  onDay?: (date: Date) => void
  onEvent: (event: CalendarEvent) => void
}) {
  const update = useUpdateEvent()
  const byId = new Map(events.map((event) => [event.id, event]))
  const colors = new Map(
    calendars.map((calendar) => [
      calendar.id,
      calendar.color,
    ])
  )
  function editable(id: string) {
    const event = byId.get(id)
    if (!event) return false
    const calendar = calendars.find(
      (item) => item.id === eventCalendarId(event)
    )
    return (
      !!calendar &&
      !calendar.isReadOnly &&
      calendar.myRights?.mayModifyItems !== false
    )
  }
  async function move(
    id: string,
    start: Date | null,
    end: Date | null,
    allDay: boolean,
    revert: () => void
  ) {
    const original = byId.get(id)
    if (!original || !start || !end) {
      revert()
      return
    }
    try {
      const draft = draftFromEvent(original)
      draft.start = localInput(start)
      draft.end = localInput(end)
      draft.allDay = allDay
      await update.mutateAsync({ id, patch: draftToEvent(draft) })
    } catch {
      revert()
    }
  }
  return (
    <div
      className="workspace-calendar h-full min-h-[400px]"
      data-view={view}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <FullCalendar
        key={`${view}-${cursor.toISOString().slice(0, 10)}-${scheduleDays}`}
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          listPlugin,
          interactionPlugin,
          classicThemePlugin,
        ]}
        initialView={viewName[view]}
        views={{ list30: { type: "list", duration: { days: scheduleDays } } }}
        initialDate={cursor}
        locale={language}
        timeZone={timeZone}
        headerToolbar={false}
        height="100%"
        firstDay={weekStartsOn}
        nowIndicator
        dayMaxEvents={3}
        eventDisplay="block"
        moreLinkClick="popover"
        selectable
        selectMirror
        editable
        eventAllow={(_span, event) => editable(event?.id ?? "")}
        eventDrop={({ event, revert }) =>
          void move(event.id, event.start, event.end, event.allDay, revert)
        }
        eventResize={({ event, revert }) =>
          void move(event.id, event.start, event.end, event.allDay, revert)
        }
        allDaySlot
        slotDuration="00:30:00"
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        scrollTime="08:00:00"
        datesSet={({ start, end }) => onRange({ start, end })}
        dateClick={({ date, allDay }) => {
          if (view === "month" && onDay) onDay(date)
          else onCreate(date, undefined, allDay)
        }}
        select={({ start, end, allDay }) => onCreate(start, end, allDay)}
        eventClick={({ event }) => {
          const found = byId.get(event.id)
          if (found) onEvent(found)
        }}
        eventContent={({ event, timeText }) => {
          const source = byId.get(event.id)
          const calendarId = source ? eventCalendarId(source) : ""
          return (
            <CalendarEventChip
              title={`${timeText ? `${timeText} ` : ""}${event.title}`}
              color={colors.get(calendarId)}
              fallbackKey={calendarId}
              className="block h-full min-w-0 truncate px-1.5 py-0.5 text-[11px] leading-snug"
            />
          )
        }}
        events={events.map((event) => ({
          id: event.id,
          title: event.title || "(no title)",
          start: eventStart(event),
          end: eventEnd(event),
          allDay: isAllDay(event),
          extendedProps: { location: eventLocation(event) },
        }))}
      />
    </div>
  )
}
