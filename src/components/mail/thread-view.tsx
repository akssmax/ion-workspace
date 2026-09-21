/**
 * Reading pane: renders all emails in the focused thread plus actions.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  MailPlus,
  MessageSquareReply,
  ReplyAll,
  Forward,
  Paperclip,
  Archive,
  Trash2,
  Star,
  MailOpen,
  ChevronDown,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Printer,
  Download,
  MoreHorizontal,
} from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EmptyState } from "@/components/ui/empty-state"
import { useLanguage } from "@/lib/language"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { EmailAddress, EmailProperties } from "@/jmap/types/mail"
import { useMailStore } from "@/stores/mail.store"
import { useComposerStore } from "@/stores/composer.store"
import type { ComposeMode } from "@/stores/composer.store"
import {
  useThread,
  useMarkRead,
  useIdentities,
  useMailboxes,
  usePermanentlyDeleteEmails,
  useReportJunk,
  useMarkNotJunk,
  useDownloadAttachment,
} from "@/queries/mail"
import { useThreadActionRunner } from "@/components/mail/thread-actions"
import { downloadAttachment } from "@/services/mail/mail.service"
import { threadActions, useContributions } from "@/features/contributions"
import {
  renderEmailBody,
  attachmentsOf,
  senderName,
  senderEmail,
} from "@/lib/html"
import {
  blockRemoteImages,
  collapseQuotedSections,
  escapeHtml,
  rewriteCidImages,
} from "@/lib/email-renderer"
import { formatDateTime } from "@/lib/dates"
import { useFeatureFlag } from "@/features/flags"
import { usePreferences } from "@/queries/preferences"
import { filenameDefaults, formatMailFilename } from "@/lib/mail-filenames"
import { zipStoredFiles } from "@/lib/zip-store"
import {
  PermanentDeleteDialog,
  trashIconButtonClassName,
} from "./permanent-delete-dialog"
import { InlineComposer } from "./composer"
import { SnoozeDialog } from "./snooze-dialog"
import {
  AttachmentThumb,
  DocumentViewer,
  kindForMime,
  mailAttachmentSource,
  primeDocumentBlob,
} from "@/components/viewer"
import type { DocumentSource } from "@/components/viewer"

/** Minimal reader stylesheet for the standalone print window. */
const PRINT_READER_CSS =
  "body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#111;margin:2rem;max-width:56rem}" +
  "h1,h2,h3,h4,h5,h6{line-height:1.3;margin:1.4em 0 .6em}h1{font-size:1.5em}h2{font-size:1.3em}h3{font-size:1.15em}" +
  "p{margin:0 0 .85em}a{color:#0d6efd;text-decoration:underline}" +
  "ul,ol{margin:0 0 .85em;padding-left:1.5em}li{margin:.25em 0}" +
  "pre{background:#f5f5f5;border:1px solid #ddd;border-radius:6px;padding:12px;white-space:pre-wrap;overflow-x:auto;font-size:.85em;line-height:1.5}" +
  "code,kbd,samp{font-family:ui-monospace,Menlo,Consolas,monospace;background:#f5f5f5;border-radius:4px;padding:.1em .35em}pre code{background:transparent;padding:0}" +
  "blockquote{border-left:3px solid #ddd;margin:.85em 0;padding-left:.9em;color:#555}" +
  "hr{margin:1.5em 0;border:0;border-top:1px solid #ddd}img{max-width:100%;height:auto}" +
  "table{border-collapse:collapse;max-width:100%}th,td{border:1px solid #ddd;padding:.4em .6em;text-align:left;vertical-align:top}th{background:#f5f5f5}"

export function ThreadViewPane({ threadId }: { threadId: string | null }) {
  const { t } = useLanguage()
  const closeCompose = useComposerStore((s) => s.closeCompose)
  const composeOpen = useComposerStore((s) => s.open)
  const composeMode = useComposerStore((s) => s.mode)
  const pinnedReply = useFeatureFlag("mail.pinnedReply")
  const { data: preferences } = usePreferences()
  const downloadForExport = useDownloadAttachment()
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const { data, isLoading } = useThread(threadId)
  const markRead = useMarkRead()
  const openedThread = useRef<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<string[] | null>(null)

  useEffect(() => {
    setExpandedIds(null)
    openedThread.current = null
  }, [threadId])

  useEffect(() => {
    if (!threadId || !data || openedThread.current === threadId) return
    openedThread.current = threadId
    const unread = data.emails
      .filter((email) => !email.keywords?.$seen)
      .map((email) => email.id)
    if (unread.length) void markRead.mutateAsync({ ids: unread, read: true })
  }, [threadId, data, markRead])

  // Drop an in-progress inline reply when leaving the thread.
  useEffect(() => {
    if (!threadId && composeOpen && isInlineComposeMode(composeMode)) {
      closeCompose()
    }
  }, [threadId, composeOpen, composeMode, closeCompose])

  if (!threadId) {
    return (
      <EmptyState
        icon={<MailPlus />}
        title={t("Select a conversation to read it.")}
        description="Pick a message from the list to open it here."
        className="h-full rounded-none border-0"
      />
    )
  }

  if (isLoading || !data) {
    return <ReadingPaneSkeleton />
  }

  async function exportThread() {
    if (!data) return
    setExporting(true)
    setExportError(null)
    try {
      const messages = data.emails.filter((email) => email.blobId)
      const files = [] as { name: string; bytes: Uint8Array }[]
      for (const [index, email] of messages.entries()) {
        const blob = await downloadForExport.mutateAsync(email.blobId!)
        const name = formatMailFilename(
          "eml",
          preferences?.emlFilenameTemplate ?? filenameDefaults.eml,
          {
            date: email.receivedAt ? new Date(email.receivedAt) : undefined,
            from: email.from?.[0]?.name ?? undefined,
            fromEmail: email.from?.[0]?.email,
            to: email.to?.[0]?.name ?? undefined,
            subject: email.subject ?? undefined,
          },
          preferences?.filenameSpaces
        )
        files.push({
          name: `${index + 1}-${name}`,
          bytes: new Uint8Array(await blob.arrayBuffer()),
        })
      }
      const archive = zipStoredFiles(files)
      const url = URL.createObjectURL(archive)
      const link = document.createElement("a")
      link.href = url
      link.download = formatMailFilename(
        "zip",
        preferences?.zipFilenameTemplate ?? filenameDefaults.zip,
        { count: files.length, subject: data.latestSubject },
        preferences?.filenameSpaces
      )
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "Could not export this thread."
      )
    } finally {
      setExporting(false)
    }
  }

  const latest = latestEmail(data.emails)
  const canExport = data.emails.filter((email) => email.blobId).length > 1
  const actionBar = (
    <div className="flex flex-wrap items-center gap-2">
      <ThreadActions threadId={threadId} email={latest} />
      <div className="ml-auto" />
      <ReplyAction email={latest} mode="reply" />
      <ReplyAction email={latest} mode="forward" />
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="More actions"
                  />
                }
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </TooltipTrigger>
          <TooltipContent>More actions</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="min-w-48">
          <ReplyMenuItem email={latest} mode="reply-all" />
          {canExport ? (
            <DropdownMenuItem
              disabled={exporting}
              onClick={() => void exportThread()}
            >
              <Download className="size-4" />
              Export ZIP
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <div
      className={
        pinnedReply
          ? "flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
          : "flex h-full min-w-0 flex-col overflow-y-auto"
      }
    >
      <div
        className={
          pinnedReply
            ? "shrink-0 border-b px-3 py-3 sm:px-6 sm:py-4"
            : "border-b px-3 py-3 sm:px-6 sm:py-4"
        }
      >
        {preferences?.messageActionsPosition !== "bottom" ? actionBar : null}
        <h2
          dir="auto"
          className="mt-2 text-lg leading-snug font-semibold break-words"
        >
          {data.latestSubject}
        </h2>
        <p className="mt-1 text-xs break-all text-muted-foreground">
          {data.emails.length} message{data.emails.length > 1 ? "s" : ""} ·{" "}
          {data.participants}
        </p>
        {data.emails.length > 1 ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setExpandedIds(data.emails.map((email) => email.id))}
          >
            Expand all messages
          </Button>
        ) : null}
        {exportError ? (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {exportError}
          </p>
        ) : null}
      </div>

      <div
        className={
          pinnedReply
            ? "min-h-0 min-w-0 flex-1 space-y-6 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-6 sm:py-5"
            : "min-w-0 flex-1 space-y-6 overflow-x-hidden px-3 py-4 sm:px-6 sm:py-5"
        }
      >
        {data.emails.map((email, index) => (
          <EmailCard
            key={email.id}
            email={email}
            expanded={
              expandedIds === null
                ? index === data.emails.length - 1
                : expandedIds.includes(email.id)
            }
            onToggle={() =>
              setExpandedIds((current) => {
                const initial = current ?? [
                  data.emails[data.emails.length - 1].id,
                ]
                return initial.includes(email.id)
                  ? initial.filter((id) => id !== email.id)
                  : [...initial, email.id]
              })
            }
          />
        ))}
        {preferences?.messageActionsPosition === "bottom" ? (
          <div className="rounded-xl border bg-card p-2">{actionBar}</div>
        ) : null}
      </div>

      <InlineComposer pinned={pinnedReply} />
    </div>
  )
}

function isInlineComposeMode(mode: ComposeMode): boolean {
  return mode === "reply" || mode === "reply-all" || mode === "forward"
}

function latestEmail(emails: EmailProperties[]): EmailProperties {
  return emails[emails.length - 1] ?? ({} as EmailProperties)
}

/**
 * Thread-level actions: archive, trash, read/unread and star toggles act on
 * every email in the thread (the service resolves thread → email ids).
 * Feature modules can add actions via the `threadActions` contribution point.
 */
function ThreadActions({
  threadId,
  email,
}: {
  threadId: string
  email: EmailProperties
}) {
  const permanentlyDelete = usePermanentlyDeleteEmails()
  const reportJunk = useReportJunk()
  const markNotJunk = useMarkNotJunk()
  const activeMailboxId = useMailStore((state) => state.activeMailboxId)
  const { data: mailboxes } = useMailboxes()
  const isTrash =
    mailboxes?.some(
      (mailbox) => mailbox.id === activeMailboxId && mailbox.role === "trash"
    ) ?? false
  const isArchive =
    mailboxes?.some(
      (mailbox) => mailbox.id === activeMailboxId && mailbox.role === "archive"
    ) ?? false
  const isJunk =
    mailboxes?.some(
      (mailbox) => mailbox.id === activeMailboxId && mailbox.role === "junk"
    ) ?? false
  const isInbox =
    mailboxes?.some(
      (mailbox) => mailbox.id === activeMailboxId && mailbox.role === "inbox"
    ) ?? false
  const { run: runThreadAction } = useThreadActionRunner(threadId)
  const contributed = useContributions(threadActions)
  const [permanentDeleteOpen, setPermanentDeleteOpen] = useState(false)

  if (!email.id) return null
  const isStarred = email.keywords?.$flagged === true
  const isUnread = email.keywords?.$seen !== true

  const actions: {
    label: string
    icon: React.ReactNode
    run: () => void
    className?: string
  }[] = [
    ...(!isTrash
      ? [
          {
            label: isArchive ? "Unarchive" : "Archive",
            icon: isArchive ? (
              <RotateCcw className="size-4" />
            ) : (
              <Archive className="size-4" />
            ),
            run: () => runThreadAction(isArchive ? "unarchive" : "archive"),
          },
        ]
      : []),
    {
      label: isTrash ? "Delete permanently" : "Move to trash",
      icon: <Trash2 className="size-4" />,
      className: trashIconButtonClassName,
      run: () =>
        isTrash ? setPermanentDeleteOpen(true) : runThreadAction("trash"),
    },
    ...(isTrash
      ? [
          {
            label: "Restore to inbox",
            icon: <RotateCcw className="size-4" />,
            run: () => runThreadAction("restore"),
          },
        ]
      : []),
    ...(isJunk
      ? [
          {
            label: "Not spam",
            icon: <ShieldCheck className="size-4" />,
            className:
              "hover:bg-warning/20 hover:text-warning-foreground focus-visible:ring-warning/30",
            run: () => void markNotJunk.mutateAsync([threadId]),
          },
        ]
      : !isTrash
        ? [
            {
              label: "Report spam",
              icon: <ShieldAlert className="size-4" />,
              className:
                "hover:bg-warning/20 hover:text-warning-foreground focus-visible:ring-warning/30",
              run: () => void reportJunk.mutateAsync({ ids: [threadId] }),
            },
            {
              label: "Report phishing",
              icon: <ShieldX className="size-4" />,
              className:
                "hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/30",
              run: () =>
                void reportJunk.mutateAsync({
                  ids: [threadId],
                  phishing: true,
                }),
            },
          ]
        : []),
    {
      label: isUnread ? "Mark as read" : "Mark as unread",
      icon: <MailOpen className="size-4" />,
      run: () => runThreadAction(isUnread ? "read" : "unread"),
    },
    {
      label: isStarred ? "Remove star" : "Star",
      icon: (
        <Star
          className={
            isStarred ? "size-4 fill-amber-400 text-amber-400" : "size-4"
          }
        />
      ),
      run: () => runThreadAction(isStarred ? "unstar" : "star"),
    },
  ]

  return (
    <div className="flex items-center gap-0.5">
      {actions.map((action) => (
        <Tooltip key={action.label}>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                onClick={action.run}
                aria-label={action.label}
                className={action.className}
              >
                {action.icon}
              </Button>
            }
          >
            <span />
          </TooltipTrigger>
          <TooltipContent>{action.label}</TooltipContent>
        </Tooltip>
      ))}
      {contributed.map((Action, i) => (
        <Action key={i} threadId={threadId} email={email} />
      ))}
      {isInbox ? <SnoozeDialog threadIds={[threadId]} /> : null}
      {isTrash ? (
        <PermanentDeleteDialog
          open={permanentDeleteOpen}
          onOpenChange={setPermanentDeleteOpen}
          onConfirm={() => void permanentlyDelete.mutateAsync([threadId])}
        />
      ) : null}
    </div>
  )
}

const REPLY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  reply: { label: "Reply", icon: <MessageSquareReply className="size-4" /> },
  "reply-all": { label: "Reply all", icon: <ReplyAll className="size-4" /> },
  forward: { label: "Forward", icon: <Forward className="size-4" /> },
}

function useReplyAction(email: EmailProperties, mode: ComposeMode) {
  const openCompose = useComposerStore((s) => s.openCompose)
  const identities = useIdentities()
  const { label, icon } = REPLY_META[mode] ?? REPLY_META.reply
  const ownAddresses = new Set(
    (identities.data ?? []).map((identity) => identity.email.toLowerCase())
  )
  const sentByMe =
    email.from?.some((address) =>
      ownAddresses.has(address.email.toLowerCase())
    ) ?? false
  const to = (
    mode === "forward"
      ? []
      : mode === "reply"
        ? sentByMe
          ? email.to
          : email.replyTo?.length
            ? email.replyTo
            : email.from
        : [
            ...(sentByMe
              ? []
              : ((email.replyTo?.length ? email.replyTo : email.from) ?? [])),
            ...(email.to ?? []),
            ...(email.cc ?? []),
          ]
  ) as EmailAddress[]
  const parentMessageId = (email.messageId ?? [])[0] ?? email.id
  const references = [
    ...new Set([
      ...(email.references ?? []),
      ...(email.inReplyTo ?? []),
      parentMessageId,
    ]),
  ].filter(Boolean)

  return {
    label,
    icon,
    open: () =>
      openCompose({
        open: true,
        mode,
        to: dedupe(to).filter(
          (address) => !ownAddresses.has(address.email.toLowerCase())
        ),
        subject: subjectFor(mode, email.subject),
        inReplyTo: [parentMessageId],
        references,
      }),
  }
}

function ReplyAction({
  email,
  mode,
}: {
  email: EmailProperties
  mode: ComposeMode
}) {
  const { label, icon, open } = useReplyAction(email, mode)
  if (!email.id && !email.subject) return null
  return (
    <Button variant="ghost" size="sm" onClick={open}>
      {icon}
      {label}
    </Button>
  )
}

function ReplyMenuItem({
  email,
  mode,
}: {
  email: EmailProperties
  mode: ComposeMode
}) {
  const { label, icon, open } = useReplyAction(email, mode)
  if (!email.id && !email.subject) return null
  return (
    <DropdownMenuItem onClick={open}>
      {icon}
      {label}
    </DropdownMenuItem>
  )
}

/** Reading-pane placeholder: shown before a thread is picked or while it loads. */
function ReadingPaneSkeleton() {
  return (
    <div className="flex h-full flex-col gap-6 p-6" aria-hidden>
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-5 w-2/3" />
      <div className="space-y-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  )
}

function subjectFor(mode: ComposeMode, subject?: string | null): string {
  const base = subject || ""
  if (mode === "forward") {
    return base.toLowerCase().startsWith("fw:") ? base : `Fwd: ${base}`
  }
  if (mode !== "new" && !/^\s*re:/i.test(base)) return `Re: ${base}`
  return base
}

function dedupe(addrs: EmailAddress[]): EmailAddress[] {
  const seen = new Set<string>()
  const out: EmailAddress[] = []
  for (const a of addrs) {
    if (!a.email) continue
    const key = a.email.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(a)
  }
  return out
}

function EmailCard({
  email,
  expanded,
  onToggle,
}: {
  email: EmailProperties
  expanded: boolean
  onToggle: () => void
}) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [loadImages, setLoadImages] = useState(false)
  const reduceMotion = useReducedMotion()
  const { data: preferences } = usePreferences()
  const downloadOriginal = useDownloadAttachment()
  const subject = email.subject || "(no subject)"
  const time = email.receivedAt ?? email.sentAt
  const attachments = useMemo(() => attachmentsOf(email), [email])
  const sender = email.from?.[0]?.email.toLowerCase() ?? ""
  const imagesAllowed =
    loadImages ||
    preferences?.remoteImages === "always" ||
    (preferences?.remoteImages === "trusted" &&
      (preferences.trustedImageSenders ?? []).includes(sender))
  const loadBlob = useCallback(
    (blobId: string) => downloadAttachment(blobId),
    []
  )

  const sources = useMemo(
    () =>
      attachments.map((att) =>
        mailAttachmentSource(att, (blobId) => loadBlob(blobId))
      ),
    [attachments, loadBlob]
  )

  // Inline (CID) images referenced by the HTML body, keyed by Content-ID.
  const cidSources = useMemo(() => {
    const map: Record<string, DocumentSource> = {}
    for (const att of attachments) {
      if (att.cid && att.blobId) {
        map[att.cid.replace(/[<>]/g, "")] = mailAttachmentSource(
          att,
          (blobId) => loadBlob(blobId)
        )
      }
    }
    return map
  }, [attachments, loadBlob])

  const [cidUrls, setCidUrls] = useState<Record<string, string>>({})
  useEffect(() => {
    if (!expanded) return
    const entries = Object.entries(cidSources)
    if (!entries.length) {
      setCidUrls((prev) => (Object.keys(prev).length ? {} : prev))
      return
    }
    const cancelled = { current: false }
    const created: string[] = []
    void Promise.all(
      entries.map(async ([cid, src]) => {
        const blob = await primeDocumentBlob(src)
        const url = URL.createObjectURL(blob)
        created.push(url)
        return [cid, url] as const
      })
    )
      .then((pairs) => {
        if (!cancelled.current) setCidUrls(Object.fromEntries(pairs))
      })
      .catch(() => {})
    return () => {
      cancelled.current = true
      for (const url of created) URL.revokeObjectURL(url)
    }
  }, [cidSources, expanded])

  const safeBody = useMemo(() => {
    const raw = renderEmailBody(email)
    return Object.keys(cidUrls).length
      ? rewriteCidImages(raw, (cid) => cidUrls[cid.replace(/[<>]/g, "")])
      : raw
  }, [email, cidUrls])
  const blocked = useMemo(() => blockRemoteImages(safeBody), [safeBody])
  const renderedBody = useMemo(
    () => collapseQuotedSections(imagesAllowed ? safeBody : blocked.html),
    [imagesAllowed, safeBody, blocked.html]
  )

  function printMessage() {
    const printable = window.open("", "_blank")
    if (!printable) return
    printable.opener = null
    const printSender = escapeHtml(email.from?.[0]?.email ?? "")
    printable.document.write(
      `<!doctype html><html><head><title>${escapeHtml(subject)}</title><meta charset="utf-8"><style>${PRINT_READER_CSS}</style></head><body><h1>${escapeHtml(subject)}</h1><p>From: ${printSender}</p><p>To: ${escapeHtml(fmtAddresses(email.to))}</p><p>${escapeHtml(time ? formatDateTime(time) : "")}</p><hr><div class="email-body">${blocked.html}</div></body></html>`
    )
    printable.document.close()
    printable.print()
  }

  async function saveOriginal() {
    if (!email.blobId) return
    const blob = await downloadOriginal.mutateAsync(email.blobId)
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = objectUrl
    link.download = formatMailFilename(
      "eml",
      preferences?.emlFilenameTemplate ?? filenameDefaults.eml,
      {
        date: time ? new Date(time) : undefined,
        from: email.from?.[0]?.name ?? undefined,
        fromEmail: sender,
        to: email.to?.[0]?.name ?? undefined,
        toEmail: email.to?.[0]?.email,
        subject,
      },
      preferences?.filenameSpaces
    )
    link.click()
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }

  return (
    <article
      dir="auto"
      className="min-w-0 overflow-hidden rounded-xl border bg-card transition-colors hover:border-ring/40"
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse message" : "Expand message"}
        onClick={onToggle}
        className="flex w-full flex-wrap items-center gap-3 border-b px-4 py-3 text-start transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {initials(senderName(email))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {senderName(email)}
            {senderEmail(email) ? (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                &lt;{senderEmail(email)}&gt;
              </span>
            ) : null}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            To: {fmtAddresses(email.to)}
            {email.cc?.length ? ` · Cc: ${fmtAddresses(email.cc)}` : ""}
          </p>
        </div>
        <time className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {time ? formatDateTime(time) : ""}
        </time>
        <ChevronDown
          aria-hidden
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="message-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }
            }
            className="min-w-0 overflow-hidden"
          >
            <p className="px-4 pt-3 text-sm font-medium">{subject}</p>
            {email.keywords?.$phishing ? (
              <p
                role="alert"
                className="mx-4 mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs"
              >
                This message was reported as phishing. Check links and
                attachments before opening them.
              </p>
            ) : null}
            <details className="mx-4 mt-2 text-xs text-muted-foreground">
              <summary className="cursor-pointer">Message details</summary>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 break-all">
                <dt>From</dt>
                <dd>{fmtAddresses(email.from)}</dd>
                <dt>To</dt>
                <dd>{fmtAddresses(email.to)}</dd>
                <dt>Cc</dt>
                <dd>{fmtAddresses(email.cc)}</dd>
                <dt>Reply-To</dt>
                <dd>{fmtAddresses(email.replyTo)}</dd>
                <dt>Message ID</dt>
                <dd>{email.messageId ?? "—"}</dd>
              </dl>
              {email.headers ? (
                <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(email.headers, null, 2)}
                </pre>
              ) : null}
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={printMessage}>
                  <Printer className="size-3.5" /> Print
                </Button>
                {email.blobId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void saveOriginal()}
                  >
                    <Download className="size-3.5" /> Download .eml
                  </Button>
                ) : null}
              </div>
            </details>

            {blocked.blocked.length > 0 && !imagesAllowed ? (
              <Button
                variant="ghost"
                size="sm"
                className="ml-3"
                onClick={() => setLoadImages(true)}
              >
                External images blocked · Load images
              </Button>
            ) : null}
            <div
              className="email-body min-w-0 px-4 py-3"
              dangerouslySetInnerHTML={{ __html: renderedBody }}
            />

            {attachments.length ? (
              <div className="space-y-2 px-4 pb-4">
                {attachments.some(
                  (att) =>
                    kindForMime(att.type ?? "", att.name ?? "") === "image"
                ) ? (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att, i) =>
                      kindForMime(att.type ?? "", att.name ?? "") ===
                      "image" ? (
                        <AttachmentThumb
                          key={sources[i].id}
                          source={sources[i]}
                          onOpen={() => setPreviewIndex(i)}
                        />
                      ) : null
                    )}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att, i) => (
                    <button
                      key={sources[i].id}
                      onClick={() => setPreviewIndex(i)}
                      className="flex items-center gap-2 rounded-lg border bg-muted/40 px-2.5 py-1.5 text-xs hover:bg-muted"
                    >
                      <Paperclip className="size-3.5 text-muted-foreground" />
                      <span className="max-w-[12rem] truncate">
                        {att.name || "attachment"}
                      </span>
                      <span className="text-muted-foreground">Preview</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <DocumentViewer
        open={previewIndex !== null}
        onOpenChange={(value) => {
          if (!value) setPreviewIndex(null)
        }}
        items={sources}
        index={previewIndex ?? 0}
        onIndexChange={setPreviewIndex}
        title={subject}
      />
    </article>
  )
}

function fmtAddresses(addrs?: EmailAddress[] | null): string {
  if (!addrs?.length) return ""
  return addrs
    .map((a) => a.name || a.email)
    .filter(Boolean)
    .join(", ")
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
