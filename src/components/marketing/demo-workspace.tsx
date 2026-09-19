import { useEffect, useState, useRef } from "react"
import { useThemeStore } from "@/theme/store"
import { useMailStore } from "@/stores/mail.store"
import { getJmapClient } from "@/services/jmap.service"
import { isPreviewConfig } from "@/lib/demo/preview-messages"
import type { DemoSurface } from "@/lib/demo/preview-messages"
import { AppShell } from "@/components/shell/app-shell"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useComposerStore } from "@/stores/composer.store"

export function DemoWorkspace({
  embedded = false,
  initialSurface = "mail",
  initialTheme = "light",
}: {
  embedded?: boolean
  initialSurface?: DemoSurface
  initialTheme?: "light" | "dark"
}) {
  const [prepared, setPrepared] = useState(false)
  const connected = useRef(false)
  const app = useWorkspaceStore((s) => s.app)
  const setApp = useWorkspaceStore((s) => s.setApp)
  const compose = useComposerStore((s) => s.openCompose)
  useEffect(() => {
    let cancelled = false
    setApp(initialSurface)
    if (embedded)
      useThemeStore.getState().setTheme({ mode: initialTheme, accent: "zinc" })
    async function prepare() {
      try {
        if (embedded && initialSurface === "mail") {
          const client = await getJmapClient()
          const inbox = (await client.mail.getMailboxes()).find(
            (box) => box.role === "inbox"
          )
          if (inbox) {
            const { emails } = await client.mail.getEmails(inbox.id, {
              collapseThreads: false,
            })
            const featured =
              emails.find(
                (email) =>
                  emails.filter((other) => other.threadId === email.threadId)
                    .length === 1
              ) ?? emails.at(0)
            if (!cancelled) {
              useMailStore.getState().setActiveMailbox(inbox.id)
              useMailStore
                .getState()
                .setFocusedThread(featured?.threadId ?? null)
            }
          }
        }
      } finally {
        if (!cancelled) setPrepared(true)
      }
    }
    void prepare().catch(() => {
      /* The shell shows normal query errors with a reset path. */
    })
    return () => {
      cancelled = true
    }
  }, [embedded, initialSurface, initialTheme, setApp])
  useEffect(() => {
    if (!embedded || !prepared) return
    function receive(event: MessageEvent) {
      if (
        event.source !== window.parent ||
        event.origin !== window.location.origin ||
        !isPreviewConfig(event.data)
      )
        return
      connected.current = true
      setApp(event.data.surface)
      useThemeStore
        .getState()
        .setTheme({ mode: event.data.theme, accent: "zinc" })
    }
    window.addEventListener("message", receive)
    window.parent.postMessage(
      { type: "ion:preview-ready" },
      window.location.origin
    )
    return () => window.removeEventListener("message", receive)
  }, [embedded, prepared, setApp])
  useEffect(() => {
    if (embedded && prepared && connected.current)
      window.parent.postMessage(
        { type: "ion:preview-surface", surface: app },
        window.location.origin
      )
  }, [app, embedded, prepared])
  if (!prepared)
    return (
      <div role="status" className="p-8 text-sm text-muted-foreground">
        Opening your sample workspace…
      </div>
    )
  return (
    <>
      <nav className="ion-demo-app-nav" aria-label="Demo apps">
        {(["mail", "calendar", "contacts", "files"] as const).map((name) => (
          <button
            key={name}
            aria-pressed={app === name}
            onClick={() => setApp(name)}
          >
            {name}
          </button>
        ))}
        <button
          onClick={() => compose({ open: true, mode: "new" })}
          aria-label="Compose sample message"
        >
          + Compose
        </button>
      </nav>
      <div className="ion-demo-app-shell">
        <AppShell />
      </div>
    </>
  )
}
