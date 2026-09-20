import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { usePreferences } from "@/queries/preferences"
import { useCalendarStore } from "@/stores/calendar.store"
import { calendarWeekStart } from "@/lib/calendar-week-start"

export function CalendarMiniPicker() {
  const cursor = useCalendarStore((state) => state.cursor)
  const setCursor = useCalendarStore((state) => state.setCursor)
  const preferences = usePreferences().data
  const weekStartsOn = calendarWeekStart(
    preferences?.language ?? "en",
    preferences?.calendarWeekStart
  )

  return (
    <div className="flex w-full min-w-0 justify-center px-3 py-3">
      <Calendar
        key={format(cursor, "yyyy-MM")}
        mode="single"
        selected={cursor}
        defaultMonth={cursor}
        weekStartsOn={weekStartsOn as 0 | 1 | 6}
        className="w-full! min-w-0 bg-transparent p-0 [--cell-size:--spacing(7)]"
        onSelect={(day) => {
          if (day) setCursor(day)
        }}
      />
    </div>
  )
}
