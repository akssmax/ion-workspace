/**
 * Floating send-status pill: shows "Sending…" / "Message sent" /
 * "Couldn't send" app-wide, auto-hiding after a few seconds.
 */

import { useEffect } from "react"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { cn } from "cn"
import { useComposerStore } from "@/stores/composer.store"
import { useCancelMailJob, useMailJobs } from "@/queries/mail-jobs"
import { Button } from "@/components/ui/button"

const AUTO_HIDE_MS = 4000
const ERROR_HIDE_MS = 12000

export function SendStatusPill() {
  const sendState = useComposerStore((s) => s.sendState)
  const sendError = useComposerStore((s) => s.sendError)
  const setSendState = useComposerStore((s) => s.setSendState)
  const jobs = useMailJobs()
  const cancel = useCancelMailJob()
  const latest = jobs.data?.find(job => job.kind === "send" && job.status === "queued")

  useEffect(() => {
    if (sendState !== "sent" && sendState !== "queued" && sendState !== "failed") return
    const timer = setTimeout(
      () => setSendState("idle"),
      sendState === "failed" ? ERROR_HIDE_MS : AUTO_HIDE_MS
    )
    return () => clearTimeout(timer)
  }, [sendState, setSendState])

  if (sendState === "idle") return null

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <SendStatusBanner
        state={sendState}
        error={sendError}
        onDismiss={() => setSendState("idle")}
      />
      {sendState === "queued" && latest ? <Button className="mt-2" variant="outline" size="sm" disabled={cancel.isPending} onClick={() => cancel.mutate(latest.id, { onSuccess: () => setSendState("idle") })}>Undo send</Button> : null}
    </div>
  )
}

export function SendStatusBanner({
  state,
  error,
  onDismiss,
  className,
}: {
  state: "sending" | "sent" | "queued" | "failed"
  error?: string | null
  onDismiss?: () => void
  className?: string
}) {
  return (
    <div
      role={state === "failed" ? "alert" : "status"}
      className={cn(
        "flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm shadow-lg",
        (state === "sent" || state === "queued") &&
          "border-transparent bg-success text-success-foreground",
        state === "failed" && "items-start rounded-2xl border-destructive/20 bg-popover",
        state === "sending" && "bg-popover",
        className
      )}
    >
      {state === "sending" ? (
        <>
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
          Sending…
        </>
      ) : state === "sent" || state === "queued" ? (
        <>
          <CheckCircle2 className="size-4" />
          {state === "queued" ? "Message queued · Undo in Outbox" : "Message sent"}
        </>
      ) : (
        <>
          <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="min-w-0">
            <p className="font-medium">Couldn&apos;t send the message</p>
            <p className="mt-0.5 max-w-80 text-xs break-words text-muted-foreground">
              {error ?? "Unknown error."}
            </p>
          </div>
          {onDismiss ? (
            <button
              className="ms-1 shrink-0 text-xs text-muted-foreground underline hover:text-foreground"
              onClick={onDismiss}
            >
              Dismiss
            </button>
          ) : null}
        </>
      )}
    </div>
  )
}
