import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Calendar, CalendarEvent } from "@/jmap/types/calendar"
import { parseIcsContents } from "@/services/calendar/calendar.service"
import { importEvents } from "@/services/calendar/calendar.service"
import { useQueryClient } from "@tanstack/react-query"
import {
  useCalendarFeeds,
  useCreateCalendarFeed,
  useDeleteCalendarFeed,
  useRefreshCalendarFeed,
} from "@/queries/calendar-feeds"

export function CalendarImport({
  open,
  onClose,
  calendars,
}: {
  open: boolean
  onClose: () => void
  calendars: Calendar[]
}) {
  const [files, setFiles] = useState<File[]>([])
  const [events, setEvents] = useState<Partial<CalendarEvent>[]>([])
  const [problems, setProblems] = useState<string[]>([])
  const [calendarId, setCalendarId] = useState("")
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState("")
  const [tab, setTab] = useState<"file" | "feed">("file")
  const [feedName, setFeedName] = useState("")
  const [feedUrl, setFeedUrl] = useState("")
  const [feedError, setFeedError] = useState("")
  const feeds = useCalendarFeeds()
  const createFeed = useCreateCalendarFeed()
  const deleteFeed = useDeleteCalendarFeed()
  const refreshFeed = useRefreshCalendarFeed()
  const qc = useQueryClient()
  const writable = calendars.filter(
    (calendar) =>
      !calendar.isReadOnly && calendar.myRights?.mayAddItems !== false
  )
  async function preview(selected: File[]) {
    setFiles(selected)
    setResult("")
    setProgress(0)
    const parsed: Partial<CalendarEvent>[] = []
    const errors: string[] = []
    for (const file of selected) {
      try {
        if (!file.name.toLowerCase().endsWith(".ics"))
          throw new Error("Only .ics files are supported.")
        if (file.size > 10_000_000) throw new Error("File exceeds 10 MB.")
        const output = await parseIcsContents(await file.text())
        parsed.push(...output.events)
        errors.push(
          ...output.errors.map((message) => `${file.name}: ${message}`)
        )
      } catch (cause) {
        errors.push(
          `${file.name}: ${cause instanceof Error ? cause.message : "Could not read file"}`
        )
      }
    }
    if (parsed.length > 10_000)
      errors.push("At most 10,000 events can be imported at once.")
    setEvents(parsed.length > 10_000 ? [] : parsed)
    setProblems(errors)
  }
  async function submit() {
    if (!events.length || (!calendarId && !writable[0])) return
    setBusy(true)
    setResult("")
    try {
      const summary = await importEvents(
        events,
        calendarId || writable[0].id,
        setProgress
      )
      setResult(
        `${summary.imported} imported · ${summary.skipped} skipped · ${summary.failed} failed`
      )
      await qc.invalidateQueries({ queryKey: ["acc", "events"] })
    } catch (cause) {
      setResult(cause instanceof Error ? cause.message : "Import failed.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !busy) onClose()
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import calendar</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={tab === "file" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab("file")}
          >
            Import .ics file
          </Button>
          <Button
            variant={tab === "feed" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab("feed")}
          >
            iCal subscription
          </Button>
        </div>
        {tab === "file" ? (
          <>
            <p className="text-sm text-muted-foreground">
              Choose iCalendar (.ics) files. Events with a matching UID in the
              destination calendar are skipped. Guests will not receive
              invitations.
            </p>
            <Label className="block space-y-2 rounded-lg border border-dashed p-4 text-center" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void preview(Array.from(event.dataTransfer.files)) }}>
              <span>Files</span>
              <Input
                type="file"
                accept=".ics,text/calendar"
                multiple
                onChange={(event) =>
                  void preview(Array.from(event.target.files ?? []))
                }
              />
              <span className="block text-xs text-muted-foreground">Choose files or drop .ics files here</span>
            </Label>
            {files.length > 0 && (
              <p className="text-sm">
                {files.length} file{files.length === 1 ? "" : "s"} ·{" "}
                {events.length} events ready
              </p>
            )}
            {events.length > 0 && (
              <div className="max-h-44 overflow-auto rounded-lg border p-2 text-xs">
                {events.slice(0, 25).map((event, index) => (
                  <p key={index} className="truncate py-1">
                    {event.title} · {event.start}
                  </p>
                ))}
                {events.length > 25 && <p>…and {events.length - 25} more</p>}
              </div>
            )}
            {problems.length > 0 && (
              <div
                role="alert"
                className="max-h-32 overflow-auto text-xs text-destructive"
              >
                {problems.slice(0, 20).map((message, index) => (
                  <p key={index}>{message}</p>
                ))}
              </div>
            )}
            <Label className="block space-y-2">
              <span>Destination calendar</span>
              <select
                className="h-10 w-full rounded-lg border bg-background px-3"
                value={calendarId || writable[0]?.id || ""}
                onChange={(event) => setCalendarId(event.target.value)}
              >
                {writable.map((calendar) => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </option>
                ))}
              </select>
            </Label>
            {busy && (
              <p className="text-xs text-muted-foreground">
                Importing {progress} of {events.length}…
              </p>
            )}
            {result && (
              <p role="status" className="text-sm">
                {result}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" disabled={busy} onClick={onClose}>
                Close
              </Button>
              <Button
                disabled={busy || !events.length || !writable.length}
                onClick={() => void submit()}
              >
                {busy ? "Importing…" : "Import events"}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Subscribe to a read-only HTTPS iCal feed. It refreshes hourly and
              appears in this app.
            </p>
            <Label className="block space-y-1">
              <span>Name</span>
              <Input
                value={feedName}
                onChange={(event) => setFeedName(event.target.value)}
                placeholder="Team calendar"
              />
            </Label>
            <Label className="block space-y-1">
              <span>iCal URL</span>
              <Input
                type="url"
                value={feedUrl}
                onChange={(event) => setFeedUrl(event.target.value)}
                placeholder="https://example.com/calendar.ics"
              />
            </Label>
            <Button
              disabled={
                createFeed.isPending || !feedName.trim() || !feedUrl.trim()
              }
              onClick={async () => {
                try {
                  setFeedError("")
                  await createFeed.mutateAsync({ name: feedName, url: feedUrl })
                  setFeedName("")
                  setFeedUrl("")
                } catch (cause) {
                  setFeedError(
                    cause instanceof Error
                      ? cause.message
                      : "Could not subscribe."
                  )
                }
              }}
            >
              Subscribe
            </Button>
            {feedError && (
              <p role="alert" className="text-xs text-destructive">
                {feedError}
              </p>
            )}
            {feeds.isError && (
              <p className="text-xs text-muted-foreground">
                Subscriptions need database storage and a signed-in account.
              </p>
            )}
            {feeds.data?.map((feed) => (
              <div key={feed.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <strong>{feed.name}</strong>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={refreshFeed.isPending}
                      onClick={() =>
                        void refreshFeed.mutateAsync(feed.id).catch(() => {})
                      }
                    >
                      Refresh
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(`Unsubscribe from ${feed.name}?`))
                          void deleteFeed.mutateAsync(feed.id)
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {feed.events.length} events ·{" "}
                  {feed.refreshedAt
                    ? `Updated ${new Date(feed.refreshedAt).toLocaleString()}`
                    : "Waiting for refresh"}
                </p>
                {feed.error && (
                  <p className="text-xs text-destructive">{feed.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
