/**
 * Mail workspace: chrome toolbar + mailbox list + reading pane.
 */

import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  Archive,
  Check,
  ChevronDown,
  FileEdit,
  Folder,
  Inbox,
  Search,
  Send,
  Star,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSidebar } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useWorkspaceStore } from "@/stores/workspace.store"
import { AdvancedSearch } from "./advanced-search"

export function MailView() {
  const activeMailboxId = useMailStore((s) => s.activeMailboxId)
  const searchQuery = useMailStore((s) => s.searchQuery)
  const setSearchQuery = useMailStore((s) => s.setSearchQuery)
  const paneView = useMailStore((s) => s.paneView)
  const focusedThreadId = useMailStore((s) => s.focusedThreadId)
  const setFocusedThread = useMailStore((s) => s.setFocusedThread)
  const setPaneView = useMailStore((s) => s.setPaneView)
  const setPaletteOpen = useWorkspaceStore((s) => s.setPaletteOpen)
  const { state: sidebarState, isMobile } = useSidebar()
  const searchRef = useRef<HTMLInputElement>(null)
  const panesRef = useRef<HTMLDivElement>(null)
  const resizeCleanup = useRef<(() => void) | null>(null)
  const [paneWidth, setPaneWidth] = useState<number | null>(null)
  const [rightSplit, setRightSplit] = useState(0.37)
  const [bottomSplit, setBottomSplit] = useState(0.46)
  const layout = useInboxLayout()

  const { data: rawMailboxes } = useMailboxes()
  const mailboxes = sortMailboxes(rawMailboxes ?? [])
  const mailbox = mailboxes.find((m) => m.id === activeMailboxId)
  const setActiveMailbox = useMailStore((s) => s.setActiveMailbox)
  const compact = isMobile || (paneWidth !== null && paneWidth < 620)
  const showMailboxMenu = sidebarState === "collapsed" || compact

  useEffect(() => {
    const element = panesRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setPaneWidth(entry.contentRect.width)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => () => resizeCleanup.current?.(), [])

  function startResize(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    event.preventDefault()
    resizeCleanup.current?.()
    const axis = verticalSplit ? "y" : "x"
    const previousCursor = document.body.style.cursor
    const previousSelection = document.body.style.userSelect
    document.body.style.cursor = verticalSplit ? "row-resize" : "col-resize"
    document.body.style.userSelect = "none"
    const move = (pointer: PointerEvent) => {
      const bounds = panesRef.current?.getBoundingClientRect()
      if (!bounds) return
      const available = axis === "x" ? bounds.width : bounds.height
      const point = axis === "x" ? pointer.clientX - bounds.left : pointer.clientY - bounds.top
      const minimum = axis === "x" ? 220 : 150
      const remaining = axis === "x" ? 280 : 220
      const size = Math.min(Math.max(point, minimum), Math.max(minimum, available - remaining))
      const next = available ? size / available : 0.5
      if (axis === "x") setRightSplit(next)
      else setBottomSplit(next)
    }
    const stop = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", stop)
      window.removeEventListener("pointercancel", stop)
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousSelection
      resizeCleanup.current = null
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", stop)
    window.addEventListener("pointercancel", stop)
    resizeCleanup.current = stop
  }

  function pickMailbox(id: string) {
    setSearchQuery("")
    setActiveMailbox(id)
    setPaneView("list+reading")
  }

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
  const hiddenPane = layout.readingPane === "hidden" || compact
  const verticalSplit = layout.readingPane === "bottom" && !compact
  const showList = hiddenPane ? !focusedThreadId : paneView !== "reading"
  const showReading = hiddenPane ? !!focusedThreadId : paneView !== "list"
  const upcomingIsland = useFeatureFlag("calendar.upcomingIsland")

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className={cn("relative z-20 flex shrink-0 items-center gap-2 overflow-visible border-b px-3 sm:px-4", compact ? "min-h-14 flex-wrap py-2" : "h-14")}>
        <div className="flex min-w-0 items-center gap-2">
          <OpenSidebarTrigger />
          {showMailboxMenu ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-w-0 gap-1.5 px-2"
                    aria-label={`Choose mailbox, current: ${mailbox?.name ?? "Inbox"}`}
                  />
                }
              >
                <MailboxIcon role={mailbox?.role} />
                <span className="max-w-28 truncate">
                  {mailbox?.name ?? (searchQuery ? "Search results" : "Inbox")}
                </span>
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-56">
                {mailboxes.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => pickMailbox(item.id)}
                  >
                    <MailboxIcon role={item.role} />
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    {(item.unreadEmails ?? 0) > 0 ? (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {item.unreadEmails}
                      </span>
                    ) : null}
                    {item.id === activeMailboxId ? (
                      <Check className="size-4 text-primary" />
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex min-w-0 items-center gap-2">
              <MailboxIcon role={mailbox?.role} />
              <h1 className="truncate text-sm font-semibold">
                {mailbox?.name ?? (searchQuery ? "Search results" : "Inbox")}
              </h1>
            </div>
          )}
        </div>

        <div className={cn("relative z-10 min-w-0 flex-1", compact ? "order-last ml-0 basis-full" : "ml-2 sm:absolute sm:left-1/2 sm:ml-0 sm:w-[min(34rem,calc(100%-20rem))] sm:-translate-x-1/2")}>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            aria-label="Search mail"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              mailbox?.role === "trash"
                ? "Search trash…"
                : compact ? "Search mail" : "Search mail (try: from:X, has:attachment)"
            }
            className="w-full pr-26 pl-9"
          />
          <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
            <AdvancedSearch onSearch={setSearchQuery} />
            <kbd
              aria-label="Press slash to search"
              className="hidden rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground shadow-xs sm:inline-flex"
            >
              /
            </kbd>
            <button
              type="button"
              aria-label="Open command palette (Command K)"
              title="Open command palette"
              onClick={() => setPaletteOpen(true)}
              className="rounded focus-visible:outline-2 focus-visible:outline-ring"
            >
              <kbd className="inline-flex rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground shadow-xs">
                ⌘ K
              </kbd>
            </button>
          </div>
        </div>
        {upcomingIsland ? <UpcomingIsland /> : null}
      </header>

      <div ref={panesRef} className={cn("flex min-h-0 min-w-0 flex-1 overflow-hidden", verticalSplit && "flex-col")}>
        {showList ? (
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-col",
              verticalSplit
                ? "min-h-[150px] shrink-0"
                : hiddenPane
                  ? "flex-1"
                  : paneView === "list+reading"
                    ? "min-w-[220px] shrink-0"
                    : "flex-1"
            )}
            style={showReading && !hiddenPane ? verticalSplit ? { height: `${bottomSplit * 100}%` } : { width: `${rightSplit * 100}%` } : undefined}
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
                narrow={showReading && !hiddenPane && !verticalSplit && paneWidth !== null && paneWidth * rightSplit < 440}
              />
            </div>
          </div>
        ) : null}

        {showList && showReading && !hiddenPane ? (
          <div
            role="separator"
            tabIndex={0}
            aria-label={verticalSplit ? "Resize message list height" : "Resize message list width"}
            aria-orientation={verticalSplit ? "horizontal" : "vertical"}
            aria-valuemin={20}
            aria-valuemax={80}
            aria-valuenow={Math.round((verticalSplit ? bottomSplit : rightSplit) * 100)}
            title="Drag to resize; double-click to reset"
            onPointerDown={startResize}
            onDoubleClick={() => verticalSplit ? setBottomSplit(0.46) : setRightSplit(0.37)}
            onKeyDown={(event) => {
              const amount = verticalSplit
                ? event.key === "ArrowDown" ? 0.04 : event.key === "ArrowUp" ? -0.04 : 0
                : event.key === "ArrowRight" ? 0.04 : event.key === "ArrowLeft" ? -0.04 : 0
              if (!amount) return
              event.preventDefault()
              const bounds = panesRef.current?.getBoundingClientRect()
              const available = verticalSplit ? bounds?.height : bounds?.width
              const minimum = verticalSplit ? 150 : 220
              const remaining = verticalSplit ? 220 : 280
              const lower = available ? minimum / available : 0.2
              const upper = available ? Math.max(lower, (available - remaining) / available) : 0.8
              const update = (value: number) => Math.min(upper, Math.max(lower, value + amount))
              if (verticalSplit) setBottomSplit(update)
              else setRightSplit(update)
            }}
            className={cn("group/separator relative z-10 shrink-0 touch-none bg-border outline-none hover:bg-primary/40 focus-visible:bg-primary/40", verticalSplit ? "h-1.5 w-full cursor-row-resize" : "h-full w-1.5 cursor-col-resize")}
          >
            <span className={cn("absolute rounded-full bg-muted-foreground/50 group-hover/separator:bg-primary group-focus-visible/separator:bg-primary", verticalSplit ? "top-1/2 left-1/2 h-0.5 w-10 -translate-x-1/2 -translate-y-1/2" : "top-1/2 left-1/2 h-10 w-0.5 -translate-x-1/2 -translate-y-1/2")} />
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
              <ThreadViewPane threadId={focusedThreadId} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function MailboxIcon({ role }: { role?: string | null }) {
  const className = "size-4 shrink-0 text-muted-foreground"
  switch (role) {
    case "inbox":
      return <Inbox className={className} />
    case "sent":
      return <Send className={className} />
    case "drafts":
      return <FileEdit className={className} />
    case "starred":
      return <Star className={className} />
    case "archive":
      return <Archive className={className} />
    case "trash":
      return <Trash2 className={className} />
    default:
      return <Folder className={className} />
  }
}
