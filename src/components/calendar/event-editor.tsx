import { useEffect, useState } from "react"
import { addHours, format } from "date-fns"
import {
  AlignLeft,
  Bell,
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  Repeat,
  Trash2,
  Users,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  draftFromEvent,
  draftToEvent,
  localInput,
  type CalendarDraft,
} from "@/lib/calendar-event"
import type { Calendar, CalendarEvent } from "@/jmap/types/calendar"
import {
  useCreateEvent,
  useDestroyEvent,
  useUpdateEvent,
} from "@/queries/calendar"
import { getEventById } from "@/services/calendar/calendar.service"

const RECURRENCE_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
}

const REMINDER_LABELS: Record<number, string> = {
  5: "5 minutes before",
  15: "15 minutes before",
  30: "30 minutes before",
  60: "1 hour before",
  1440: "1 day before",
}

export function emptyDraft(
  start: Date,
  calendarId: string,
  timeZone: string
): CalendarDraft {
  return {
    title: "",
    calendarId,
    start: localInput(start),
    end: localInput(addHours(start, 1)),
    allDay: false,
    timeZone,
    description: "",
    location: "",
    meetingUrl: "",
    guests: [],
    recurrence: "none",
    interval: 1,
    repeatUntil: "",
    reminderMinutes: null,
    busy: true,
  }
}

export function EventEditor({
  event,
  initial,
  calendars,
  onClose,
}: {
  event: CalendarEvent | null
  initial: CalendarDraft | null
  calendars: Calendar[]
  onClose: () => void
}) {
  const [editing, setEditing] = useState(!event)
  const [draft, setDraft] = useState<CalendarDraft>(() =>
    event
      ? draftFromEvent(event)
      : (initial ??
        emptyDraft(
          new Date(),
          "",
          Intl.DateTimeFormat().resolvedOptions().timeZone
        ))
  )
  const [guestText, setGuestText] = useState("")
  const [sendInvitations, setSendInvitations] = useState(true)
  const [scope, setScope] = useState<"occurrence" | "series">("occurrence")
  const [seriesEvent, setSeriesEvent] = useState<CalendarEvent | null>(null)
  const [error, setError] = useState("")
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const create = useCreateEvent()
  const update = useUpdateEvent()
  const remove = useDestroyEvent()
  useEffect(() => {
    if (event) {
      setDraft(draftFromEvent(event))
      setEditing(false)
    } else if (initial) {
      setDraft(initial)
      setEditing(true)
    }
    setError("")
    setConfirmDiscard(false)
    setScope("occurrence")
    setSeriesEvent(null)
  }, [event, initial])
  const open = Boolean(event || initial)
  const currentCalendar = calendars.find(
    (calendar) => calendar.id === draft.calendarId
  )
  const canEdit =
    !currentCalendar?.isReadOnly &&
    (event
      ? currentCalendar?.myRights?.mayModifyItems !== false
      : currentCalendar?.myRights?.mayAddItems !== false)
  async function chooseScope(next: "occurrence" | "series") {
    setScope(next)
    if (next === "series" && event?.baseEventId) {
      try {
        const base = await getEventById(event.baseEventId)
        if (!base) throw new Error("Could not load the recurring series.")
        setSeriesEvent(base)
        setDraft(draftFromEvent(base))
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load recurring series."
        )
      }
    } else if (event) setDraft(draftFromEvent(event))
  }
  function patch<K extends keyof CalendarDraft>(
    key: K,
    value: CalendarDraft[K]
  ) {
    setDraft((old) => ({ ...old, [key]: value }))
  }
  function close() {
    if (
      editing &&
      JSON.stringify(draft) !== JSON.stringify(event ? draftFromEvent(event) : initial)
    ) {
      setConfirmDiscard(true)
      return
    }
    onClose()
  }
  async function save() {
    try {
      setError("")
      const emailList = guestText
        .split(/[\s,;]+/)
        .map((entry) => entry.trim())
        .filter(Boolean)
      if (emailList.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
        throw new Error("Check guest email addresses.")
      const payload = draftToEvent({
        ...draft,
        guests: [...new Set([...draft.guests, ...emailList])],
      })
      if (event)
        await update.mutateAsync({
          id: scope === "series" && seriesEvent ? seriesEvent.id : event.id,
          patch: payload,
          sendInvitations,
        })
      else await create.mutateAsync({ event: payload, sendInvitations })
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save event.")
    }
  }
  const pending = create.isPending || update.isPending || remove.isPending
  const startDate = new Date(draft.start)
  const endDate = new Date(draft.end)
  const validStart = Number.isFinite(startDate.getTime())
  const validEnd = Number.isFinite(endDate.getTime())
  const viewWhen = draft.allDay
    ? validStart
      ? `${format(startDate, "EEEE, d MMMM")} · All day`
      : "All day"
    : validStart && validEnd
      ? `${format(startDate, "EEEE, d MMMM")} · ${format(startDate, "p")} – ${format(endDate, "p")}`
      : `${draft.start} – ${draft.end}`
  const repeatLabel =
    draft.recurrence === "none"
      ? ""
      : `${RECURRENCE_LABELS[draft.recurrence]}${draft.interval > 1 ? ` every ${draft.interval}` : ""}${draft.repeatUntil ? `, until ${format(new Date(draft.repeatUntil), "d MMM yyyy")}` : ""}`
  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        if (!value) close()
      }}
    >
      <SheetContent
        side="right"
        className="w-full max-w-none sm:max-w-[480px] data-[side=right]:sm:max-w-[480px]"
      >
        <SheetHeader>
          {editing ? (
            <>
              <SheetTitle>{event ? "Edit event" : "Create event"}</SheetTitle>
              <SheetDescription>
                Set the details for your calendar.
              </SheetDescription>
            </>
          ) : (
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-1.5 size-3 shrink-0 rounded-sm"
                style={{
                  backgroundColor: currentCalendar?.color ?? "var(--primary)",
                }}
              />
              <div className="min-w-0">
                <SheetTitle className="text-lg leading-snug break-words">
                  {draft.title || event?.title || "Event"}
                </SheetTitle>
                <SheetDescription>{viewWhen}</SheetDescription>
              </div>
            </div>
          )}
        </SheetHeader>
        {confirmDiscard && <div role="alert" className="mx-6 mb-3 rounded-lg border border-destructive/40 p-3 text-sm"><p className="mb-2">Discard unsaved changes?</p><div className="flex gap-2"><Button size="sm" variant="destructive" onClick={onClose}>Discard</Button><Button size="sm" variant="outline" onClick={() => setConfirmDiscard(false)}>Keep editing</Button></div></div>}
        {event?.baseEventId && (
          <div className="px-6 pb-3">
            <label className="block space-y-1 text-xs text-muted-foreground">
              <span>Change</span>
              <select
                className="h-9 w-full rounded-lg border bg-background px-2 text-sm text-foreground"
                value={scope}
                onChange={(e) =>
                  void chooseScope(e.target.value as "occurrence" | "series")
                }
              >
                <option value="occurrence">This occurrence</option>
                <option value="series">Entire series</option>
              </select>
            </label>
          </div>
        )}
        {editing ? (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-6">
            <Field label="Title">
              <Input
                autoFocus
                value={draft.title}
                onChange={(e) => patch("title", e.target.value)}
                placeholder="Add title"
              />
            </Field>
            <Field label="Calendar">
              <select
                className="h-10 w-full rounded-lg border bg-background px-3"
                value={draft.calendarId}
                onChange={(e) => patch("calendarId", e.target.value)}
              >
                {calendars
                  .filter(
                    (calendar) =>
                      !calendar.isReadOnly &&
                      calendar.myRights?.mayAddItems !== false
                  )
                  .map((calendar) => (
                    <option key={calendar.id} value={calendar.id}>
                      {calendar.name}
                    </option>
                  ))}
              </select>
            </Field>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.allDay}
                onChange={(e) => patch("allDay", e.target.checked)}
              />
              All day
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Starts">
                <Input
                  type="datetime-local"
                  value={draft.start}
                  onChange={(e) => patch("start", e.target.value)}
                />
              </Field>
              <Field label="Ends">
                <Input
                  type="datetime-local"
                  value={draft.end}
                  onChange={(e) => patch("end", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Time zone">
              <Input
                value={draft.timeZone}
                onChange={(e) => patch("timeZone", e.target.value)}
                placeholder="IANA time zone"
              />
            </Field>
            <Field label="Location">
              <Input
                value={draft.location}
                onChange={(e) => patch("location", e.target.value)}
                placeholder="Add location"
              />
            </Field>
            <Field label="Meeting link">
              <Input
                type="url"
                value={draft.meetingUrl}
                onChange={(e) => patch("meetingUrl", e.target.value)}
                placeholder="https://…"
              />
            </Field>
            <Field label="Guests">
              <Input
                value={guestText || draft.guests.join(", ")}
                onChange={(e) => {
                  setGuestText(e.target.value)
                  if (draft.guests.length) patch("guests", [])
                }}
                placeholder="Email addresses, separated by commas"
              />
            </Field>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sendInvitations}
                onChange={(e) => setSendInvitations(e.target.checked)}
              />
              Send invitations and updates to guests
            </label>
            <Field label="Repeat">
              <select
                className="h-10 w-full rounded-lg border bg-background px-3"
                value={draft.recurrence}
                onChange={(e) =>
                  patch(
                    "recurrence",
                    e.target.value as CalendarDraft["recurrence"]
                  )
                }
              >
                {["none", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"].map(
                  (value) => (
                    <option key={value} value={value}>
                      {value === "none"
                        ? "Does not repeat"
                        : value.toLowerCase()}
                    </option>
                  )
                )}
              </select>
            </Field>
            {draft.recurrence !== "none" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Every">
                  <Input
                    type="number"
                    min="1"
                    max="99"
                    value={draft.interval}
                    onChange={(e) => patch("interval", Number(e.target.value))}
                  />
                </Field>
                <Field label="Until (optional)">
                  <Input
                    type="date"
                    value={draft.repeatUntil}
                    onChange={(e) => patch("repeatUntil", e.target.value)}
                  />
                </Field>
              </div>
            )}
            <Field label="Reminder">
              <select
                className="h-10 w-full rounded-lg border bg-background px-3"
                value={draft.reminderMinutes ?? ""}
                onChange={(e) =>
                  patch(
                    "reminderMinutes",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">None</option>
                <option value="5">5 minutes before</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="1440">1 day before</option>
              </select>
            </Field>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.busy}
                onChange={(e) => patch("busy", e.target.checked)}
              />
              Show as busy
            </label>
            <Field label="Description">
              <Textarea
                value={draft.description}
                onChange={(e) => patch("description", e.target.value)}
                placeholder="Add details"
              />
            </Field>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <div className="space-y-5">
              <DetailRow icon={<Clock className="size-4" />}>
                <p className="font-medium">{viewWhen}</p>
                <p className="text-xs text-muted-foreground">
                  {draft.timeZone}
                </p>
              </DetailRow>

              {draft.location ? (
                <DetailRow icon={<MapPin className="size-4" />}>
                  <p>{draft.location}</p>
                </DetailRow>
              ) : null}

              {draft.meetingUrl ? (
                <DetailRow icon={<Video className="size-4" />}>
                  <a
                    href={draft.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 break-all text-primary hover:underline"
                  >
                    {draft.meetingUrl}
                    <ExternalLink className="size-3.5 shrink-0" />
                  </a>
                </DetailRow>
              ) : null}

              {draft.guests.length > 0 ? (
                <DetailRow icon={<Users className="size-4" />}>
                  <p className="font-medium">
                    {draft.guests.length} guest
                    {draft.guests.length > 1 ? "s" : ""}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {draft.guests.map((guest) => (
                      <li key={guest} className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarFallback className="text-[10px] font-semibold">
                            {guest.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 truncate">{guest}</span>
                      </li>
                    ))}
                  </ul>
                </DetailRow>
              ) : null}

              {draft.reminderMinutes != null ? (
                <DetailRow icon={<Bell className="size-4" />}>
                  <p>
                    {REMINDER_LABELS[draft.reminderMinutes] ??
                      `${draft.reminderMinutes} minutes before`}
                  </p>
                </DetailRow>
              ) : null}

              {repeatLabel ? (
                <DetailRow icon={<Repeat className="size-4" />}>
                  <p>{repeatLabel}</p>
                </DetailRow>
              ) : null}

              <DetailRow icon={<CalendarDays className="size-4" />}>
                <p>{currentCalendar?.name ?? "Calendar"}</p>
              </DetailRow>

              {draft.description ? (
                <DetailRow icon={<AlignLeft className="size-4" />}>
                  <p className="whitespace-pre-wrap">{draft.description}</p>
                </DetailRow>
              ) : null}

              {error && (
                <p role="alert" className="text-destructive">
                  {error}
                </p>
              )}
            </div>
          </div>
        )}
        <SheetFooter className="flex-row border-t pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {editing ? (
            <>
              <Button type="button" variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={pending || !draft.title.trim() || !canEdit}
                onClick={() => void save()}
              >
                {pending ? "Saving…" : "Save event"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                disabled={!canEdit}
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                disabled={pending || !canEdit}
                onClick={async () => {
                  if (!event || !window.confirm("Delete this event?")) return
                  try {
                    await remove.mutateAsync(
                      scope === "series" && seriesEvent
                        ? seriesEvent.id
                        : event.id
                    )
                    onClose()
                  } catch (cause) {
                    setError(
                      cause instanceof Error
                        ? cause.message
                        : "Could not delete event."
                    )
                  }
                }}
              >
                <Trash2 className="size-4" /> Delete
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <Label className="block space-y-1.5 text-sm">
      <span>{label}</span>
      {children}
    </Label>
  )
}

function DetailRow({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
