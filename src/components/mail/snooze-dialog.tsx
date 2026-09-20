import { useState } from "react"
import { Clock3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useMailJobsCapability, useQueueMailSnooze } from "@/queries/mail-jobs"

export function SnoozeDialog({ threadIds }: { threadIds: string[] }) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("09:00")
  const capability = useMailJobsCapability()
  const snooze = useQueueMailSnooze()
  if (!capability.data) return null
  async function submit() {
    const at = new Date(`${date}T${time}`)
    if (!Number.isFinite(at.getTime()) || at.getTime() < Date.now() + 60_000) return
    try { await snooze.mutateAsync({ threadIds, wakeAt: at.toISOString() }); setOpen(false) } catch { /* Keep the dialog and draft open. */ }
  }
  return <>
    <Button variant="ghost" size="sm" disabled={!threadIds.length} onClick={() => setOpen(true)}><Clock3 className="size-4" /> Snooze</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle>Snooze {threadIds.length > 1 ? `${threadIds.length} conversations` : "conversation"}</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">Move out of Inbox until the chosen time. The conversation will return automatically.</p>
      <div className="grid gap-2"><Label htmlFor="snooze-date">Wake date</Label><DatePicker id="snooze-date" value={date} onChange={setDate} /><Label htmlFor="snooze-time">Wake time</Label><Input id="snooze-time" type="time" value={time} onChange={event => setTime(event.target.value)} /></div>
      {snooze.isError ? <p role="alert" className="text-sm text-destructive">{snooze.error.message}</p> : null}
      <Button disabled={!date || snooze.isPending || new Date(`${date}T${time}`).getTime() < Date.now() + 60_000} onClick={() => void submit()}>Snooze</Button>
    </DialogContent></Dialog>
  </>
}
