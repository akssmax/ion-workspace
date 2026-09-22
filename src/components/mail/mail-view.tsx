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
  SquarePen,
  Star,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "cn"
import { useMailStore } from "@/stores/mail.store"
import { useMailboxes } from "@/queries/mail"
import { EmailList } from "./email-list"
import { ThreadActionsProvider } from "./thread-actions"
import { MailboxHeader } from "./mailbox-header"
import { ThreadViewPane } from "./thread-view"
import { useInboxLayout } from "@/queries/preferences"
import { OpenSidebarTrigger } from "@/components/shell/open-sidebar-trigger"
import { SettingsButton } from "@/components/shell/settings-button"
import { MobileFab } from "@/components/shell/mobile-fab"
import { useComposerStore } from "@/stores/composer.store"
import { useFeatureFlag } from "@/features/flags"
import { UpcomingIsland } from "@/modules/calendar/upcoming-island"
import { ThemeMenu } from "@/components/theme/theme-menu"
import { MailLayoutMenu } from "./mail-layout-menu"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { AdvancedSearch } from "./advanced-search"
import { useLanguage } from "@/lib/language"
import { usePreferences, useSavePreferences } from "@/queries/preferences"
import type { MailQuickFilter, MailSort } from "@/lib/mail-list"
import type { TranslationKey } from "@/lib/language"

const mailboxRoleLabels: Record<string, TranslationKey> = {
  inbox: "Inbox",
  sent: "Sent",
  drafts: "Drafts",
  archive: "Archive",
  junk: "Junk",
  trash: "Trash",
  starred: "Starred",
  important: "Important",
}

export function MailView() {
  return (
    <ThreadActionsProvider>
      <MailViewInner />
    </ThreadActionsProvider>
  )
}

function MailViewInner() {
  const { t, direction } = useLanguage()
  const activeMailboxId = useMailStore((s) => s.activeMailboxId)
  const searchQuery = useMailStore((s) => s.searchQuery)
  const setSearchQuery = useMailStore((s) => s.setSearchQuery)
  // Debounce the search passed to the data layer: fuzzy search scans a window
  // per keystroke, so we don't want a request for every character.
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery)
  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearchQuery(searchQuery),
      250
    )
    return () => window.clearTimeout(timer)
  }, [searchQuery])
  const paneView = useMailStore((s) => s.paneView)
  const focusedThreadId = useMailStore((s) => s.focusedThreadId)
  const setFocusedThread = useMailStore((s) => s.setFocusedThread)
  const setPaneView = useMailStore((s) => s.setPaneView)
  const setPaletteOpen = useWorkspaceStore((s) => s.setPaletteOpen)
  const openCompose = useComposerStore((s) => s.openCompose)
  const { state: sidebarState, isMobile } = useSidebar()
  const searchRef = useRef<HTMLInputElement>(null)
  const panesRef = useRef<HTMLDivElement>(null)
  const resizeCleanup = useRef<(() => void) | null>(null)
  const [paneWidth, setPaneWidth] = useState<number | null>(null)
  const [rightSplit, setRightSplit] = useState(0.37)
  const [bottomSplit, setBottomSplit] = useState(0.46)
  const [mailPage, setMailPage] = useState(0)
  const [quickFilters, setQuickFilters] = useState<MailQuickFilter[]>([])
  const [searchFocused, setSearchFocused] = useState(false)
  const { data: preferences } = usePreferences()
  const savePreferences = useSavePreferences()
  const layout = useInboxLayout()

  const { data: rawMailboxes } = useMailboxes()
  const mailboxes = rawMailboxes ?? []
  const mailbox = mailboxes.find((m) => m.id === activeMailboxId)
  // Never send an unresolved/stale mailbox id (e.g. a mock id persisted from a
  // previous session) to the server — Stalwart rejects unknown ids with a 400.
  const resolvedMailboxId = mailbox?.id ?? null
  const sort =
    preferences?.mailSortByMailbox?.[activeMailboxId ?? "all"] ?? "newest"
  const listScope = { sort, sent: mailbox?.role === "sent", quickFilters }
  function changeSort(value: MailSort) {
    savePreferences.mutate({
      mailSortByMailbox: {
        ...preferences?.mailSortByMailbox,
        [activeMailboxId ?? "all"]: value,
      },
    })
  }
  const mailboxLabel = (item: typeof mailbox) =>
    item?.role ? t(mailboxRoleLabels[item.role] ?? item.name) : item?.name
  const setActiveMailbox = useMailStore((s) => s.setActiveMailbox)
  const compact = isMobile || (paneWidth !== null && paneWidth < 620)
  // Search starts compact and grows to full width when focused or filled.
  const hasSearch = searchQuery.length > 0
  const searchExpanded = searchFocused || hasSearch
  // Shortcuts only make sense on an empty field; once searching, show a clear.
  const showSearchHints = !hasSearch && (compact || searchExpanded)
  const showMailboxMenu = sidebarState === "collapsed" || compact

  useEffect(() => {
    setMailPage(0)
  }, [activeMailboxId, searchQuery, sort, quickFilters])
  useEffect(() => {
    setQuickFilters([])
  }, [activeMailboxId])

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
      const point =
        axis === "x"
          ? direction === "rtl"
            ? bounds.right - pointer.clientX
            : pointer.clientX - bounds.left
          : pointer.clientY - bounds.top
      const minimum = axis === "x" ? 220 : 150
      const remaining = axis === "x" ? 280 : 220
      const size = Math.min(
        Math.max(point, minimum),
        Math.max(minimum, available - remaining)
      )
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

  // Default to the Inbox when there is no active mailbox, or when the stored
  // id no longer exists for this account (switching mock → real, deleted
  // folder, account change).
  useEffect(() => {
    if (!rawMailboxes?.length) return
    if (activeMailboxId && rawMailboxes.some((m) => m.id === activeMailboxId))
      return
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
  // On phones the reading view is full-screen; a compose FAB would cover it.
  const readingThread = hiddenPane && !!focusedThreadId

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header
        className={cn(
          "relative z-20 flex shrink-0 items-center gap-2 overflow-visible border-b px-3 sm:px-4",
          compact ? "min-h-14 flex-wrap py-2" : "h-14"
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <OpenSidebarTrigger />
          {showMailboxMenu ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm-touch"
                    className="min-w-0 gap-1.5 px-2"
                    aria-label={`${t("Choose mailbox")}: ${mailboxLabel(mailbox) ?? t("Inbox")}`}
                  />
                }
              >
                <MailboxIcon role={mailbox?.role} />
                <span className="max-w-28 truncate">
                  {mailboxLabel(mailbox) ??
                    (searchQuery ? t("Search results") : t("Inbox"))}
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
                    <span className="min-w-0 flex-1 truncate">
                      {mailboxLabel(item)}
                    </span>
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
                {mailboxLabel(mailbox) ??
                  (searchQuery ? t("Search results") : t("Inbox"))}
              </h1>
            </div>
          )}
        </div>

        <div
          className={cn(
            "relative z-10 min-w-0 flex-1",
            compact
              ? "order-last ml-0 basis-full"
              : cn(
                  "ml-2 sm:absolute sm:left-1/2 sm:ml-0 sm:-translate-x-1/2",
                  "sm:transition-[width] sm:duration-300 sm:ease-out",
                  searchExpanded
                    ? "sm:w-[min(34rem,calc(100%-20rem))]"
                    : "sm:w-56"
                )
          )}
        >
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            aria-label={t("Search mail")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder={
              mailbox?.role === "trash" ? t("Search trash…") : t("Search mail")
            }
            className={cn(
              "w-full ps-9",
              showSearchHints ? "pe-32" : hasSearch ? "pe-20" : "pe-10"
            )}
          />
          <div className="absolute inset-y-0 end-2 flex items-center gap-1 whitespace-nowrap">
            <AdvancedSearch onSearch={setSearchQuery} />
            {hasSearch ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchQuery("")
                  searchRef.current?.focus()
                }}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring md:size-7"
              >
                <X className="size-4" />
              </button>
            ) : showSearchHints ? (
              <>
                <kbd
                  aria-label="Press slash to search"
                  className="hidden h-6 min-w-6 shrink-0 items-center justify-center rounded border bg-background px-1.5 font-mono text-[10px] leading-none text-muted-foreground shadow-xs sm:inline-flex"
                >
                  /
                </kbd>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        aria-label="Open command palette (Command K)"
                        onClick={() => setPaletteOpen(true)}
                        className="inline-flex h-7 shrink-0 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-ring"
                      />
                    }
                  >
                    <kbd className="inline-flex h-6 shrink-0 items-center justify-center rounded border bg-background px-1.5 font-mono text-[10px] leading-none text-muted-foreground shadow-xs">
                      ⌘ K
                    </kbd>
                  </TooltipTrigger>
                  <TooltipContent>Open command palette</TooltipContent>
                </Tooltip>
              </>
            ) : null}
          </div>
        </div>
        <div className="ms-auto flex items-center gap-1.5">
          <SettingsButton />
          <ThemeMenu />
          <MailLayoutMenu />
          {upcomingIsland ? (
            <>
              <Separator
                orientation="vertical"
                className="mx-1 h-6 self-center!"
              />
              <UpcomingIsland />
            </>
          ) : null}
        </div>
      </header>

      <div
        ref={panesRef}
        className={cn(
          "flex min-h-0 min-w-0 flex-1 overflow-hidden",
          verticalSplit && "flex-col"
        )}
      >
        {showList ? (
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-col",
              verticalSplit
                ? "min-h-[150px] shrink-0"
                : hiddenPane
                  ? "flex-1"
                  : paneView === "list+reading"
                    ? "min-w-[320px] shrink-0"
                    : "flex-1"
            )}
            style={
              showReading && !hiddenPane
                ? verticalSplit
                  ? { height: `${bottomSplit * 100}%` }
                  : { width: `${rightSplit * 100}%` }
                : undefined
            }
          >
            <MailboxHeader
              mailboxId={resolvedMailboxId}
              query={debouncedSearchQuery}
              page={mailPage}
              onPageChange={setMailPage}
              sort={sort}
              onSortChange={changeSort}
              quickFilters={quickFilters}
              onQuickFiltersChange={setQuickFilters}
              sent={listScope.sent}
            />
            <div className="min-h-0 flex-1 overflow-hidden">
              <EmailList
                mailboxId={resolvedMailboxId}
                query={debouncedSearchQuery}
                page={mailPage}
                sort={sort}
                sent={listScope.sent}
                quickFilters={quickFilters}
                featuredThreadId={focusedThreadId}
                density={layout.listDensity}
                showSnippets={layout.showSnippets}
                rowStyle={layout.rowStyle}
                unreadStyle={layout.unreadStyle}
                narrow={
                  showReading &&
                  !hiddenPane &&
                  !verticalSplit &&
                  paneWidth !== null &&
                  paneWidth * rightSplit < 440
                }
              />
            </div>
          </div>
        ) : null}

        {showList && showReading && !hiddenPane ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <div
                  role="separator"
                  tabIndex={0}
                  aria-label={
                    verticalSplit
                      ? "Resize message list height"
                      : "Resize message list width"
                  }
                  aria-orientation={verticalSplit ? "horizontal" : "vertical"}
                  aria-valuemin={20}
                  aria-valuemax={80}
                  aria-valuenow={Math.round(
                    (verticalSplit ? bottomSplit : rightSplit) * 100
                  )}
                  onPointerDown={startResize}
                  onDoubleClick={() =>
                    verticalSplit ? setBottomSplit(0.46) : setRightSplit(0.37)
                  }
                  onKeyDown={(event) => {
                    const amount = verticalSplit
                      ? event.key === "ArrowDown"
                        ? 0.04
                        : event.key === "ArrowUp"
                          ? -0.04
                          : 0
                      : event.key === "ArrowRight"
                        ? direction === "rtl"
                          ? -0.04
                          : 0.04
                        : event.key === "ArrowLeft"
                          ? direction === "rtl"
                            ? 0.04
                            : -0.04
                          : 0
                    if (!amount) return
                    event.preventDefault()
                    const bounds = panesRef.current?.getBoundingClientRect()
                    const available = verticalSplit
                      ? bounds?.height
                      : bounds?.width
                    const minimum = verticalSplit ? 150 : 320
                    const remaining = verticalSplit ? 220 : 280
                    const lower = available ? minimum / available : 0.2
                    const upper = available
                      ? Math.max(lower, (available - remaining) / available)
                      : 0.8
                    const update = (value: number) =>
                      Math.min(upper, Math.max(lower, value + amount))
                    if (verticalSplit) setBottomSplit(update)
                    else setRightSplit(update)
                  }}
                  className={cn(
                    "group/separator relative z-10 shrink-0 touch-none bg-border outline-none before:absolute before:bg-transparent before:content-[''] focus-visible:bg-primary",
                    verticalSplit
                      ? "h-px w-full cursor-row-resize before:inset-x-0 before:-inset-y-2"
                      : "h-full w-px cursor-col-resize before:-inset-x-2 before:inset-y-0"
                  )}
                />
              }
            >
              <span
                className={cn(
                  "pointer-events-none absolute rounded-full bg-primary opacity-0 transition-opacity group-hover/separator:opacity-100 group-focus-visible/separator:opacity-100 max-lg:opacity-100",
                  verticalSplit
                    ? "top-1/2 left-1/2 h-1 w-10 -translate-x-1/2 -translate-y-1/2"
                    : "top-1/2 left-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2"
                )}
              />
            </TooltipTrigger>
            <TooltipContent>
              Drag to resize; double-click to reset
            </TooltipContent>
          </Tooltip>
        ) : null}

        <div
          className={cn(
            "min-w-0 flex-1 flex-col",
            showReading ? "flex" : "hidden",
            verticalSplit && "min-h-[220px]"
          )}
        >
          {hiddenPane ? (
            <div className="flex h-12 shrink-0 items-center gap-2 border-b px-2">
              <Button
                variant="ghost"
                size="sm-touch"
                onClick={() => setFocusedThread(null)}
              >
                <ArrowLeft className="size-4 rtl:rotate-180" />
                {t("Back")}
              </Button>
            </div>
          ) : null}
          <div className="min-h-0 flex-1">
            <ThreadViewPane threadId={focusedThreadId} />
          </div>
        </div>
      </div>
      {readingThread ? null : (
        <MobileFab
          icon={SquarePen}
          label={t("Compose")}
          onClick={() => openCompose({ open: true, mode: "new" })}
        />
      )}
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
