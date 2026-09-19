/**
 * Mail workspace: chrome toolbar + mailbox list + reading pane.
 */

import { useEffect, useRef } from "react"
import { ArrowLeft, Inbox, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "cn"
import { useMailStore } from "@/stores/mail.store"
import { useMailboxes, sortMailboxes } from "@/queries/mail"
import { EmailList } from "./email-list"
import { MailboxHeader } from "./mailbox-header"
import { ThreadViewPane } from "./thread-view"
import { useInboxLayout } from "@/queries/preferences"
import { OpenSidebarTrigger } from "@/components/shell/open-sidebar-trigger"
import { useFeatureFlag } from "@/features/flags"
import { UpcomingIsland } from "@/modules/calendar/upcoming-island"

export function MailView() {
  const activeMailboxId = useMailStore((s) => s.activeMailboxId)
  const searchQuery = useMailStore((s) => s.searchQuery)
  const setSearchQuery = useMailStore((s) => s.setSearchQuery)
  const paneView = useMailStore((s) => s.paneView)
  const focusedThreadId = useMailStore((s) => s.focusedThreadId)
  const setFocusedThread = useMailStore((s) => s.setFocusedThread)
  const searchRef = useRef<HTMLInputElement>(null)
  const layout = useInboxLayout()

  const { data: rawMailboxes } = useMailboxes()
  const mailboxes = sortMailboxes(rawMailboxes ?? [])
  const mailbox = mailboxes.find((m) => m.id === activeMailboxId)
  const setActiveMailbox = useMailStore((s) => s.setActiveMailbox)

  // Fresh sessions have no active mailbox — default to the Inbox so the
  // list isn't empty until the user picks a folder.
  useEffect(() => {
    if (activeMailboxId || !rawMailboxes?.length) return
    const inbox =
      rawMailboxes.find((m) => m.role === "inbox") ?? rawMailboxes[0]
    setActiveMailbox(inbox.id)
  }, [activeMailboxId, rawMailboxes, setActiveMailbox])

  useEffect(() => {
    const focusSearch = () => searchRef.current?.focus()
    window.addEventListener("workspace:focus-search", focusSearch)
    return () =>
      window.removeEventListener("workspace:focus-search", focusSearch)
  }, [])

  // Layout: "hidden" is Gmail-style drill-in (list <-> full reading view);
  // "right"/"bottom" are Outlook-style splits. The legacy paneView toggles
  // still apply in split modes.
  const hiddenPane = layout.readingPane === "hidden"
  const verticalSplit = layout.readingPane === "bottom"
  const showList = hiddenPane ? !focusedThreadId : paneView !== "reading"
  const showReading = hiddenPane ? !!focusedThreadId : paneView !== "list"
  const upcomingIsland = useFeatureFlag("calendar.upcomingIsland")

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="relative z-20 flex h-14 shrink-0 items-center gap-2 overflow-visible border-b px-4">
        <div className="flex min-w-0 items-center gap-2">
          <OpenSidebarTrigger />
          <Inbox className="size-4 text-muted-foreground" />
          <h1 className="truncate text-sm font-semibold">
            {mailbox?.name ?? (searchQuery ? "Search results" : "Inbox")}
          </h1>
        </div>

        <div className="ml-2 flex min-w-0 flex-1 items-center gap-2">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                mailbox?.role === "trash"
                  ? "Search trash…"
                  : "Search mail (try: from:X, has:attachment)"
              }
              className="pl-9"
            />
          </div>
        </div>
        {upcomingIsland ? <UpcomingIsland /> : null}
      </header>

      <div className={cn("flex min-h-0 flex-1", verticalSplit && "flex-col")}>
        {showList ? (
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-col",
              verticalSplit
                ? "min-h-[180px] flex-1 border-b"
                : hiddenPane
                  ? "flex-1"
                  : paneView === "list+reading"
                    ? "w-[340px] shrink-0 border-r"
                    : "flex-1"
            )}
          >
            <MailboxHeader />
            <div className="min-h-0 flex-1 overflow-hidden">
              <EmailList
                mailboxId={activeMailboxId}
                query={searchQuery}
                featuredThreadId={focusedThreadId}
                density={layout.listDensity}
                showSnippets={layout.showSnippets}
                rowStyle={layout.rowStyle}
              />
            </div>
          </div>
        ) : null}

        {showReading ? (
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col",
              verticalSplit && "min-h-[220px]"
            )}
          >
            {hiddenPane ? (
              <div className="flex h-12 shrink-0 items-center gap-2 border-b px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFocusedThread(null)}
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
              </div>
            ) : null}
            <div className="min-h-0 flex-1">
              <ThreadViewPane
                threadId={focusedThreadId}
                onBack={
                  hiddenPane ? () => setFocusedThread(null) : undefined
                }
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
