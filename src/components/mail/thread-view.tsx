/**
 * Reading pane: renders all emails in the focused thread plus actions.
 */

import { useEffect, useRef, useState } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { EmailAddress, EmailBodyPart, EmailProperties } from "@/jmap/types/mail"
import { useMailStore } from "@/stores/mail.store"
import { useComposerStore, type ComposeMode } from "@/stores/composer.store"
import {
  useThread,
  useArchiveEmails,
  useTrashEmails,
  useMarkRead,
  useMarkStarred,
  useIdentities,
  useMailboxes,
  useRestoreEmails,
  usePermanentlyDeleteEmails,
  useReportJunk,
  useMarkNotJunk,
  useDownloadAttachment,
} from "@/queries/mail"
import { threadActions, useContributions } from "@/features/contributions"
import {
  renderEmailBody,
  attachmentsOf,
  senderName,
  senderEmail,
} from "@/lib/html"
import { blockRemoteImages, collapseQuotedSections, escapeHtml } from "@/lib/email-renderer"
import { formatDateTime } from "@/lib/dates"
import { useFeatureFlag } from "@/features/flags"
import { usePreferences } from "@/queries/preferences"
import { filenameDefaults, formatMailFilename } from "@/lib/mail-filenames"
import {
  TrashConfirmDialog,
  trashIconButtonClassName,
} from "./trash-confirm-dialog"
import { InlineComposer } from "./composer"
import { AttachmentViewer } from "./attachment-viewer"

export function ThreadViewPane({
  threadId,
}: {
  threadId: string | null
}) {
  const closeCompose = useComposerStore((s) => s.closeCompose)
  const composeOpen = useComposerStore((s) => s.open)
  const composeMode = useComposerStore((s) => s.mode)
  const pinnedReply = useFeatureFlag("mail.pinnedReply")
  const { data: preferences } = usePreferences()
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
    const unread = data.emails.filter((email) => !email.keywords?.$seen).map((email) => email.id)
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
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
        <MailPlus className="size-10 text-muted-foreground/40" />
        <p>Select a conversation to read it.</p>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <div className="space-y-3 pt-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  const actionBar = (
    <div className="flex flex-wrap items-center gap-2">
      <ThreadActions threadId={threadId} email={latestEmail(data.emails)} />
      <div className="ml-auto" />
      <ReplyAction email={latestEmail(data.emails)} mode="reply" />
      <ReplyAction email={latestEmail(data.emails)} mode="reply-all" />
      <ReplyAction email={latestEmail(data.emails)} mode="forward" />
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
          pinnedReply ? "shrink-0 border-b px-3 py-3 sm:px-6 sm:py-4" : "border-b px-3 py-3 sm:px-6 sm:py-4"
        }
      >
        {preferences?.messageActionsPosition !== "bottom" ? actionBar : null}
        <h2 className="mt-2 break-words text-lg leading-snug font-semibold">
          {data.latestSubject}
        </h2>
        <p className="mt-1 break-all text-xs text-muted-foreground">
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
            expanded={expandedIds === null ? index === data.emails.length - 1 : expandedIds.includes(email.id)}
            onToggle={() => setExpandedIds((current) => {
              const initial = current ?? [data.emails[data.emails.length - 1].id]
              return initial.includes(email.id)
                ? initial.filter((id) => id !== email.id)
                : [...initial, email.id]
            })}
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
  const archive = useArchiveEmails()
  const trash = useTrashEmails()
  const restore = useRestoreEmails()
  const permanentlyDelete = usePermanentlyDeleteEmails()
  const reportJunk = useReportJunk()
  const markNotJunk = useMarkNotJunk()
  const activeMailboxId = useMailStore((state) => state.activeMailboxId)
  const { data: mailboxes } = useMailboxes()
  const isTrash = mailboxes?.some((mailbox) => mailbox.id === activeMailboxId && mailbox.role === "trash") ?? false
  const isJunk = mailboxes?.some((mailbox) => mailbox.id === activeMailboxId && mailbox.role === "junk") ?? false
  const read = useMarkRead()
  const starred = useMarkStarred()
  const contributed = useContributions(threadActions)
  const [trashConfirmOpen, setTrashConfirmOpen] = useState(false)

  if (!email.id) return null
  const isStarred = email.keywords?.$flagged === true
  const isUnread = email.keywords?.$seen !== true

  const actions: {
    label: string
    icon: React.ReactNode
    run: () => void
    className?: string
  }[] = [
    {
      label: "Archive",
      icon: <Archive className="size-4" />,
      run: () => void archive.mutateAsync([threadId]),
    },
    {
      label: isTrash ? "Delete permanently" : "Move to trash",
      icon: <Trash2 className="size-4" />,
      className: trashIconButtonClassName,
      run: () => setTrashConfirmOpen(true),
    },
    ...(isTrash ? [{
      label: "Restore to inbox",
      icon: <RotateCcw className="size-4" />,
      run: () => void restore.mutateAsync([threadId]),
    }] : []),
    ...(isJunk ? [{
      label: "Not spam",
      icon: <ShieldCheck className="size-4" />,
      className: "hover:bg-warning/20 hover:text-warning-foreground focus-visible:ring-warning/30",
      run: () => void markNotJunk.mutateAsync([threadId]),
    }] : !isTrash ? [{
      label: "Report spam",
      icon: <ShieldAlert className="size-4" />,
      className: "hover:bg-warning/20 hover:text-warning-foreground focus-visible:ring-warning/30",
      run: () => void reportJunk.mutateAsync({ ids: [threadId] }),
    }, {
      label: "Report phishing",
      icon: <ShieldX className="size-4" />,
      className: "hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/30",
      run: () => void reportJunk.mutateAsync({ ids: [threadId], phishing: true }),
    }] : []),
    {
      label: isUnread ? "Mark as read" : "Mark as unread",
      icon: <MailOpen className="size-4" />,
      run: () => void read.mutateAsync({ ids: [threadId], read: isUnread }),
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
      run: () =>
        void starred.mutateAsync({ ids: [threadId], starred: !isStarred }),
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
      <TrashConfirmDialog
      open={trashConfirmOpen}
      onOpenChange={setTrashConfirmOpen}
      permanent={isTrash}
      onConfirm={() => void (isTrash ? permanentlyDelete : trash).mutateAsync([threadId])}
      />
    </div>
  )
}

function ReplyAction({
  email,
  mode,
}: {
  email: EmailProperties
  mode: ComposeMode
}) {
  const openCompose = useComposerStore((s) => s.openCompose)
  const identities = useIdentities()

  if (!email.id && !email.subject) return null

  const labels: Record<string, { label: string; icon: React.ReactNode }> = {
    reply: { label: "Reply", icon: <MessageSquareReply className="size-4" /> },
    "reply-all": { label: "Reply all", icon: <ReplyAll className="size-4" /> },
    forward: { label: "Forward", icon: <Forward className="size-4" /> },
  }
  const { label, icon } = labels[mode] ?? labels.reply

  const ownAddresses = new Set((identities.data ?? []).map((identity) => identity.email.toLowerCase()))
  const sentByMe = email.from?.some((address) => ownAddresses.has(address.email.toLowerCase())) ?? false
  const to = (
    mode === "forward"
      ? []
      : mode === "reply"
        ? sentByMe ? email.to : email.replyTo?.length ? email.replyTo : email.from
        : [...(sentByMe ? [] : (email.replyTo?.length ? email.replyTo : email.from) ?? []), ...(email.to ?? []), ...(email.cc ?? [])]
  ) as EmailAddress[]

  const references = [
    ...(email.references ?? []),
    ...(email.inReplyTo ?? []),
  ].filter(Boolean)

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() =>
        openCompose({
          open: true,
          mode,
          to: dedupe(to).filter(
            (address) =>
              !ownAddresses.has(address.email.toLowerCase())
          ),
          subject: subjectFor(mode, email.subject),
          inReplyTo: [email.messageId ?? email.id].filter(Boolean),
          references,
        })
      }
    >
      {icon}
      {label}
    </Button>
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

function EmailCard({ email, expanded, onToggle }: {
  email: EmailProperties
  expanded: boolean
  onToggle: () => void
}) {
  const [preview, setPreview] = useState<EmailBodyPart | null>(null)
  const [loadImages, setLoadImages] = useState(false)
  const { data: preferences } = usePreferences()
  const downloadOriginal = useDownloadAttachment()
  const subject = email.subject || "(no subject)"
  const time = email.receivedAt ?? email.sentAt
  const attachments = attachmentsOf(email)
  const safeBody = renderEmailBody(email)
  const blocked = blockRemoteImages(safeBody)
  const sender = email.from?.[0]?.email.toLowerCase() ?? ""
  const imagesAllowed = loadImages || preferences?.remoteImages === "always" || (preferences?.remoteImages === "trusted" && (preferences.trustedImageSenders ?? []).includes(sender))

  function printMessage() {
    const printable = window.open("", "_blank")
    if (!printable) return
    printable.opener = null
    const sender = escapeHtml(email.from?.[0]?.email ?? "")
    printable.document.write(`<!doctype html><html><head><title>${escapeHtml(subject)}</title><meta charset="utf-8"></head><body><h1>${escapeHtml(subject)}</h1><p>From: ${sender}</p><p>To: ${escapeHtml(fmtAddresses(email.to))}</p><p>${escapeHtml(time ? formatDateTime(time) : "")}</p><hr>${blocked.html}</body></html>`)
    printable.document.close()
    printable.print()
  }

  async function saveOriginal() {
    if (!email.blobId) return
    const blob = await downloadOriginal.mutateAsync(email.blobId)
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = objectUrl
    link.download = formatMailFilename("eml", preferences?.emlFilenameTemplate ?? filenameDefaults.eml, { date: time ? new Date(time) : undefined, from: email.from?.[0]?.name ?? undefined, fromEmail: sender, to: email.to?.[0]?.name ?? undefined, toEmail: email.to?.[0]?.email, subject }, preferences?.filenameSpaces)
    link.click()
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border bg-card">
      <header className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
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
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={expanded ? "Collapse message" : "Expand message"}
          aria-expanded={expanded}
          onClick={onToggle}
        >
          <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </Button>
      </header>
      {expanded ? <p className="px-4 pt-3 text-sm font-medium">{subject}</p> : null}
      {expanded && email.keywords?.$phishing ? (
        <p role="alert" className="mx-4 mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs">
          This message was reported as phishing. Check links and attachments before opening them.
        </p>
      ) : null}
      {expanded ? (
        <details className="mx-4 mt-2 text-xs text-muted-foreground">
          <summary className="cursor-pointer">Message details</summary>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 break-all">
            <dt>From</dt><dd>{fmtAddresses(email.from)}</dd>
            <dt>To</dt><dd>{fmtAddresses(email.to)}</dd>
            <dt>Cc</dt><dd>{fmtAddresses(email.cc)}</dd>
            <dt>Reply-To</dt><dd>{fmtAddresses(email.replyTo)}</dd>
            <dt>Message ID</dt><dd>{email.messageId ?? "—"}</dd>
          </dl>
          {email.headers ? <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap">{JSON.stringify(email.headers, null, 2)}</pre> : null}
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={printMessage}><Printer className="size-3.5" /> Print</Button>
            {email.blobId ? <Button size="sm" variant="outline" onClick={() => void saveOriginal()}><Download className="size-3.5" /> Download .eml</Button> : null}
          </div>
        </details>
      ) : null}

      {expanded && blocked.blocked.length > 0 && !imagesAllowed ? (
        <Button variant="ghost" size="sm" className="ml-3" onClick={() => setLoadImages(true)}>
          External images blocked · Load images
        </Button>
      ) : null}
      {expanded ? (
        <div
          className="min-w-0 break-words px-4 py-3 text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: collapseQuotedSections(imagesAllowed ? safeBody : blocked.html) }}
        />
      ) : null}

      {expanded && attachments.length ? (
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          {attachments.map((att, i) => {
            const blobId = att.blobId ?? att.partId ?? undefined
            return (
              <button
                key={`${blobId ?? "att"}-${i}`}
                disabled={!blobId}
                onClick={() => {
                  if (blobId) setPreview(att)
                }}
                className="flex items-center gap-2 rounded-lg border bg-muted/40 px-2.5 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
              >
                <Paperclip className="size-3.5 text-muted-foreground" />
                <span className="max-w-[12rem] truncate">
                  {att.name || "attachment"}
                </span>
                <span className="text-muted-foreground">Preview</span>
              </button>
            )
          })}
        </div>
      ) : null}
      <AttachmentViewer attachment={preview} onClose={() => setPreview(null)} subject={subject} sender={sender} />
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
