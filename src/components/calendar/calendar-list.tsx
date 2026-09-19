import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { accentClasses, isHexColor, resolveAccent } from "@/lib/accents"
import { useCalendarStore } from "@/stores/calendar.store"
import {
  useCalendarCapabilities,
  useCalendars,
  useCreateCalendar,
} from "@/queries/calendar"
import { useCalendarFeeds } from "@/queries/calendar-feeds"

function ColorDot({ color, id }: { color?: string | null; id: string }) {
  return (
    <span
      aria-hidden="true"
      className={`size-2.5 shrink-0 rounded-full ${accentClasses(resolveAccent(color, id)).dot}`}
      style={color && isHexColor(color) ? { backgroundColor: color } : undefined}
    />
  )
}

export function CalendarList() {
  const calendars = useCalendars()
  const feeds = useCalendarFeeds()
  const capabilities = useCalendarCapabilities()
  const createCalendar = useCreateCalendar()
  const hidden = useCalendarStore((state) => state.hiddenCalendarIds)
  const setCalendarVisible = useCalendarStore((state) => state.setCalendarVisible)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  async function addCalendar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    setError("")
    try {
      await createCalendar.mutateAsync({ name: name.trim() })
      setName("")
      setAdding(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create calendar.")
    }
  }

  return (
    <div className="space-y-3 px-2 py-3">
      <div className="flex items-center justify-between gap-2 px-2">
        <h3 className="text-xs font-medium text-muted-foreground">My calendars</h3>
        {!capabilities.data?.accountReadOnly && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Add calendar"
            title="Add calendar"
            onClick={() => setAdding(true)}
          >
            <Plus className="size-4" />
          </Button>
        )}
      </div>
      {calendars.isLoading && <p className="px-2 text-xs text-muted-foreground">Loading calendars…</p>}
      {calendars.data?.map((calendar) => (
        <label key={calendar.id} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-sidebar-accent sm:min-h-9">
          <Checkbox
            aria-label={`Show ${calendar.name} calendar`}
            checked={!hidden.includes(calendar.id)}
            onCheckedChange={(checked) => setCalendarVisible(calendar.id, checked === true)}
          />
          <ColorDot color={calendar.color} id={calendar.id} />
          <span className="min-w-0 flex-1 truncate">{calendar.name}</span>
          {calendar.isReadOnly && <span className="text-[10px] text-muted-foreground">Read only</span>}
        </label>
      ))}
      {adding && (
        <form className="space-y-2 px-2" onSubmit={(event) => void addCalendar(event)}>
          <Input autoFocus aria-label="New calendar name" placeholder="Calendar name" value={name} onChange={(event) => setName(event.target.value)} />
          <div className="flex gap-1">
            <Button size="sm" type="submit" disabled={!name.trim() || createCalendar.isPending}>Add</Button>
            <Button size="sm" type="button" variant="ghost" onClick={() => { setAdding(false); setError("") }}>Cancel</Button>
          </div>
        </form>
      )}
      {error && <p role="alert" className="px-2 text-xs text-destructive">{error}</p>}
      {!!feeds.data?.length && (
        <div className="border-t pt-3">
          <h3 className="px-2 pb-2 text-xs font-medium text-muted-foreground">Subscribed calendars</h3>
          {feeds.data.map((feed) => {
            const id = `feed:${feed.id}`
            return (
              <label key={id} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-sidebar-accent sm:min-h-9">
                <Checkbox
                  aria-label={`Show ${feed.name} calendar`}
                  checked={!hidden.includes(id)}
                  onCheckedChange={(checked) => setCalendarVisible(id, checked === true)}
                />
                <ColorDot color={feed.color} id={id} />
                <span className="min-w-0 flex-1 truncate">{feed.name}</span>
                <span className="text-[10px] text-muted-foreground">Read only</span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
