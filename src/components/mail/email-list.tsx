/**
 * Email list for a mailbox or search query (collapsed thread rows).
 *
 * Three row styles (Settings → Inbox → Row style):
 * - `minimal` — the original text-only rows.
 * - `gmail`   — single-line rows with a checkbox to the left of a persistent
 *   sender avatar.
 * - `outlook` — multi-line rows with the same checkbox + avatar, unread accent
 *   bar and bold unread sender.
 *
 * Bulk selection: every row style has a visible checkbox.
 * Ctrl/Cmd-click toggles; Shift-click selects the visible range from the
 * last-selected row. Clicking the rest of the row opens the conversation.
 */

import { useEffect } from "react"
import { Star, Paperclip, MailPlus } from "lucide-react"
import { cn } from "cn"
import type { EmailProperties } from "@/jmap/types/mail"
import { useMailStore } from "@/stores/mail.store"
import { useComposerStore } from "@/stores/composer.store"
import { useEmails } from "@/queries/mail"
import { senderName, emailHasAttachments } from "@/lib/html"
import { formatRelative } from "@/lib/dates"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { parseSearch } from "@/lib/search"
import type { ListDensity, RowStyle } from "@/lib/inbox-layout"
import { useFeatureFlag } from "@/features/flags"
import { LabelChips } from "@/modules/mail/labels"

export function EmailList({
  mailboxId,
  query,
  featuredThreadId,
  density = "comfortable",
  showSnippets = true,
  rowStyle = "minimal",
  narrow = false,
}: {
  mailboxId: string | null
  query: string
  featuredThreadId: string | null
  density?: ListDensity
  showSnippets?: boolean
  rowStyle?: RowStyle
  narrow?: boolean
}) {
  const setFocusedThread = useMailStore((s) => s.setFocusedThread)
  const selectedThreadIds = useMailStore((s) => s.selectedThreadIds)
  const toggleThreadSelection = useMailStore((s) => s.toggleThreadSelection)
  const selectRange = useMailStore((s) => s.selectRange)
  const clearSelection = useMailStore((s) => s.clearSelection)
  const openCompose = useComposerStore((s) => s.openCompose)

  const parsed = parseSearch(query)
  const scope = {
    mailboxId: parsed.mailboxNames.length
      ? undefined
      : (mailboxId ?? undefined),
    query: parsed.query || undefined,
  }
  const emails = useEmails(scope)

  // Switching mailbox or editing the query drops stale selection.
  useEffect(() => {
    clearSelection()
  }, [mailboxId, query, clearSelection])

  const rows = emails.data?.pages.flatMap((page) => page.emails) ?? []

  // Publish visible thread ids so the toolbar's select-all can act on them.
  const setVisibleThreadIds = useMailStore((s) => s.setVisibleThreadIds)
  useEffect(() => {
    setVisibleThreadIds(rows.map((r) => r.threadId))
  }, [rows, setVisibleThreadIds])

  if (emails.isLoading) {
    const skeletonHeight =
      density === "compact" ? "h-9" : density === "cozy" ? "h-14" : "h-16"
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className={cn(skeletonHeight, "w-full")} />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
        <MailPlus className="size-8 text-muted-foreground/40" />
        <p>
          {parsed.query
            ? "No messages matched your search."
            : "This mailbox is empty."}
        </p>
      </div>
    )
  }

  function onRowClick(row: EmailProperties, e: React.MouseEvent) {
    const threadId = row.threadId
    if (e.shiftKey) {
      const anchor = selectedThreadIds.at(-1) ?? featuredThreadId ?? threadId
      selectRange(anchor, threadId)
      return
    }
    if (e.ctrlKey || e.metaKey) {
      toggleThreadSelection(threadId)
      return
    }
    // Drafts reopen in the composer instead of the reading pane.
    if (row.keywords?.$draft) {
      openCompose({ mode: "draft", draftEmailId: row.id })
      return
    }
    setFocusedThread(threadId)
  }

  return (
    <div
      className="h-full min-w-0 overflow-x-hidden overflow-y-auto"
      onScroll={(event) => {
        const el = event.currentTarget
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 240 && emails.hasNextPage && !emails.isFetchingNextPage) {
          void emails.fetchNextPage()
        }
      }}
    >
      {emails.data?.pages[0]?.state === "offline" ? (
        <p role="status" className="border-b bg-muted px-3 py-1.5 text-xs text-muted-foreground">Offline · showing cached messages</p>
      ) : null}
      {rows.map((row) => {
        const threadId = row.threadId
        const selected = selectedThreadIds.includes(threadId)
        const shared = {
          email: row,
          featured: !!featuredThreadId && featuredThreadId === threadId,
          selected,
          density,
          showSnippets,
          narrow,
          onSelect: (e: React.MouseEvent) => onRowClick(row, e),
          onToggleSelect: () => toggleThreadSelection(threadId),
        }
        return rowStyle === "gmail" ? (
          <GmailRow key={threadId} {...shared} />
        ) : rowStyle === "outlook" ? (
          <OutlookRow key={threadId} {...shared} />
        ) : (
          <MinimalRow key={threadId} {...shared} />
        )
      })}
      {emails.hasNextPage ? (
        <button
          type="button"
          className="w-full border-t p-3 text-sm text-muted-foreground hover:bg-muted/50"
          disabled={emails.isFetchingNextPage}
          onClick={() => void emails.fetchNextPage()}
        >
          {emails.isFetchingNextPage ? "Loading more messages…" : "Load more messages"}
        </button>
      ) : null}
    </div>
  )
}

// -- Shared row pieces -------------------------------------------------------

interface RowProps {
  email: EmailProperties
  featured: boolean
  selected: boolean
  density: ListDensity
  showSnippets: boolean
  narrow: boolean
  onSelect: (e: React.MouseEvent) => void
  onToggleSelect: () => void
}

const AVATAR_COLORS = [
  "bg-rose-500/25 text-rose-700 dark:text-rose-300",
  "bg-amber-500/25 text-amber-700 dark:text-amber-300",
  "bg-emerald-500/25 text-emerald-700 dark:text-emerald-300",
  "bg-sky-500/25 text-sky-700 dark:text-sky-300",
  "bg-violet-500/25 text-violet-700 dark:text-violet-300",
  "bg-pink-500/25 text-pink-700 dark:text-pink-300",
  "bg-teal-500/25 text-teal-700 dark:text-teal-300",
  "bg-indigo-500/25 text-indigo-700 dark:text-indigo-300",
]

function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function senderInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  )
}

function RowCheckbox({
  selected,
  name,
  onToggleSelect,
}: {
  selected: boolean
  name: string
  onToggleSelect: () => void
}) {
  return (
    <Checkbox
      checked={selected}
      onCheckedChange={() => onToggleSelect()}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={`Select conversation from ${name}`}
      className="shrink-0 after:hidden"
    />
  )
}

function RowAvatar({
  email,
  size = "size-8",
}: {
  email: EmailProperties
  size?: string
}) {
  const name = senderName(email)
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        size,
        avatarColor(name)
      )}
    >
      {senderInitials(name)}
    </span>
  )
}

function RowBadges({ email, narrow = false }: { email: EmailProperties; narrow?: boolean }) {
  const labelsEnabled = useFeatureFlag("mail.labels")
  return (
    <>
      {labelsEnabled && !narrow ? <LabelChips email={email} /> : null}
      {emailHasAttachments(email) ? (
        <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
      ) : null}
      {email.keywords?.$flagged ? (
        <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
      ) : null}
    </>
  )
}

function rowBackground({
  featured,
  selected,
}: {
  featured: boolean
  selected: boolean
}) {
  return featured
    ? "bg-accent"
    : selected
      ? "bg-accent/40"
      : "hover:bg-muted/60"
}

// -- Gmail: single-line rows with avatar -------------------------------------

function GmailRow(props: RowProps) {
  if (props.narrow) return <OutlookRow {...props} />
  const { email, density, showSnippets, onSelect } = props
  const sender = senderName(email)
  const subject = email.subject || "(no subject)"
  const isUnread = email.keywords?.$seen !== true
  const time = email.receivedAt ?? email.sentAt

  return (
    <div
      className={cn(
        "group/row flex w-full min-w-0 items-center gap-2 overflow-hidden border-b px-3 text-sm transition-colors",
        density === "compact" ? "py-1" : density === "cozy" ? "py-1.5" : "py-2",
        rowBackground(props)
      )}
    >
      <RowCheckbox
        selected={props.selected}
        name={sender}
        onToggleSelect={props.onToggleSelect}
      />
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden text-left"
      >
        <RowAvatar email={email} size="size-7" />
        <span
          className={cn(
            "w-32 shrink-0 truncate sm:w-44",
            isUnread && "font-semibold"
          )}
        >
          {sender}
        </span>
        <span className="min-w-0 flex-1 truncate">
          <span className={cn(isUnread ? "font-medium" : "text-foreground/80")}>
            {subject}
          </span>
          {showSnippets && email.preview ? (
            <span className="text-muted-foreground/80">
              {" "}
              &ndash; {email.preview}
            </span>
          ) : null}
        </span>
        <RowBadges email={email} narrow={props.narrow} />
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {time ? formatRelative(time) : ""}
        </span>
      </button>
    </div>
  )
}

// -- Outlook: avatar + multi-line rows with unread accent --------------------

function OutlookRow(props: RowProps) {
  const { email, density, showSnippets, onSelect } = props
  const sender = senderName(email)
  const subject = email.subject || "(no subject)"
  const isUnread = email.keywords?.$seen !== true
  const time = email.receivedAt ?? email.sentAt
  const showSnippet = showSnippets && email.preview && density !== "compact"

  return (
    <div
      className={cn(
        "group/row relative flex w-full min-w-0 items-start gap-2 overflow-hidden border-b px-3 transition-colors",
        density === "compact"
          ? "py-1.5"
          : density === "cozy"
            ? "py-2"
            : "py-2.5",
        rowBackground(props)
      )}
    >
      {isUnread ? (
        <span
          aria-hidden
          className="absolute top-1 bottom-1 left-0 w-0.5 rounded-full bg-primary"
        />
      ) : null}
      <RowCheckbox
        selected={props.selected}
        name={sender}
        onToggleSelect={props.onToggleSelect}
      />
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-start gap-3 overflow-hidden text-left"
      >
        <RowAvatar
          email={email}
          size={density === "compact" ? "size-7" : "size-9"}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-baseline gap-2">
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                isUnread && "font-semibold"
              )}
            >
              {sender}
            </span>
            <RowBadges email={email} narrow={props.narrow} />
            <span
              className={cn(
                "shrink-0 text-xs tabular-nums",
                isUnread
                  ? "font-semibold text-primary"
                  : "text-muted-foreground"
              )}
            >
              {time ? formatRelative(time) : ""}
            </span>
          </span>
          <span
            className={cn(
              "truncate text-sm",
              isUnread ? "font-medium" : "text-foreground/80"
            )}
          >
            {subject}
          </span>
          {showSnippet ? (
            <span className="truncate text-xs text-muted-foreground/80">
              {email.preview}
            </span>
          ) : null}
        </span>
      </button>
    </div>
  )
}

// -- Minimal: the original text-only rows ------------------------------------

function MinimalRow(props: RowProps) {
  const { email, density, showSnippets, onSelect } = props
  const sender = senderName(email)
  const subject = email.subject || "(no subject)"
  const isUnread = email.keywords?.$seen !== true
  const time = email.receivedAt ?? email.sentAt

  if (density === "compact" && !props.narrow) {
    return (
      <div
        className={cn(
          "group/row flex w-full min-w-0 items-center gap-2 overflow-hidden border-b px-3 py-1.5 text-sm transition-colors",
          rowBackground(props)
        )}
      >
        <RowCheckbox
          selected={props.selected}
          name={sender}
          onToggleSelect={props.onToggleSelect}
        />
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-left"
        >
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              isUnread ? "bg-primary" : "bg-transparent"
            )}
            aria-hidden
          />
          <span
            className={cn(
              "w-32 shrink-0 truncate sm:w-40",
              isUnread && "font-semibold"
            )}
          >
            {sender}
          </span>
          <span className="min-w-0 flex-1 truncate">
            <span
              className={cn(isUnread ? "font-medium" : "text-foreground/80")}
            >
              {subject}
            </span>
            {showSnippets && email.preview ? (
              <span className="text-muted-foreground/80">
                {" "}
                &ndash; {email.preview}
              </span>
            ) : null}
          </span>
          <RowBadges email={email} narrow={props.narrow} />
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {time ? formatRelative(time) : ""}
          </span>
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group/row flex w-full min-w-0 items-start gap-2 overflow-hidden border-b px-3 transition-colors",
        density === "cozy" ? "py-1.5" : "py-2.5",
        rowBackground(props)
      )}
    >
      <RowCheckbox
        selected={props.selected}
        name={sender}
        onToggleSelect={props.onToggleSelect}
      />
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden text-left"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              isUnread ? "bg-primary" : "bg-transparent"
            )}
            aria-hidden
          />
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              isUnread && "font-semibold"
            )}
          >
            {sender}
          </span>
          <RowBadges email={email} narrow={props.narrow} />
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {time ? formatRelative(time) : ""}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-2 pl-4">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              isUnread ? "font-medium" : "text-foreground/80"
            )}
          >
            {subject}
          </span>
        </div>
        {showSnippets && email.preview ? (
          <span className="block w-full truncate pl-4 text-xs text-muted-foreground/80">
            {email.preview}
          </span>
        ) : null}
      </button>
    </div>
  )
}
