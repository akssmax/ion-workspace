/**
 * Floating send-status pill: shows "Sending…" / "Message sent" /
 * "Couldn't send" app-wide, auto-hiding after a few seconds.
 */

import { useEffect } from "react"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { cn } from "cn"
import { useComposerStore } from "@/stores/composer.store"

const AUTO_HIDE_MS = 4000

export function SendStatusPill() {
  const sendState = useComposerStore((s) => s.sendState)
  const sendError = useComposerStore((s) => s.sendError)
  const setSendState = useComposerStore((s) => s.setSendState)

  useEffect(() => {
    if (sendState !== "sent" && sendState !== "failed") return
    const timer = setTimeout(() => setSendState("idle"), AUTO_HIDE_MS)
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
    </div>
  )
}

export function SendStatusBanner({
  state,
  error,
  onDismiss,
  className,
}: {
  state: "sending" | "sent" | "failed"
  error?: string | null
  onDismiss?: () => void
  className?: string
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm shadow-lg",
        state === "sent" &&
          "border-transparent bg-success text-success-foreground",
        state === "failed" && "border-destructive/20 bg-popover",
        state === "sending" && "bg-popover",
        className
      )}
    >
      {state === "sending" ? (
        <>
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
          Sending…
        </>
      ) : state === "sent" ? (
        <>
          <CheckCircle2 className="size-4" />
          Message sent
        </>
      ) : (
        <>
          <XCircle className="size-4 text-destructive" />
          <span className="max-w-64 truncate">
            {error ?? "Couldn't send the message."}
          </span>
          {onDismiss ? (
            <button
              className="ml-1 text-xs text-muted-foreground underline hover:text-foreground"
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
