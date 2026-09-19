/**
 * Reading pane: renders all emails in the focused thread plus actions.
 */

import { useEffect, useState } from "react"
import {
  MailPlus,
  MessageSquareReply,
  ReplyAll,
  Forward,
  Paperclip,
  Download,
  Archive,
  Trash2,
  Star,
  MailOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { EmailAddress, EmailProperties } from "@/jmap/types/mail"
import { useMailStore } from "@/stores/mail.store"
import { useComposerStore, type ComposeMode } from "@/stores/composer.store"
import {
  useThread,
  useArchiveEmails,
  useTrashEmails,
  useMarkRead,
  useMarkStarred,
  useDownloadAttachment,
} from "@/queries/mail"
import {
  threadActions,
  useContributions,
} from "@/features/contributions"
import {
  renderEmailBody,
  attachmentsOf,
  senderName,
  senderEmail,
} from "@/lib/html"
import { formatDateTime } from "@/lib/dates"
import {
  TrashConfirmDialog,
  trashIconButtonClassName,
} from "./trash-confirm-dialog"
import { InlineComposer } from "./composer"

export function ThreadViewPane({
  threadId,
  onBack,
}: {
  threadId: string | null
  onBack?: () => void
}) {
  const setPaneView = useMailStore((s) => s.setPaneView)
  const closeCompose = useComposerStore((s) => s.closeCompose)
  const composeOpen = useComposerStore((s) => s.open)
  const composeMode = useComposerStore((s) => s.mode)
  const { data, isLoading } = useThread(threadId)
  const goBack = onBack ?? (() => setPaneView("list"))

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
        <Button variant="outline" size="sm" onClick={goBack}>
          Back to list
        </Button>
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

  return (
    <div className="flex h-full min-w-0 flex-col overflow-y-auto">
      <div className="border-b px-6 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goBack}>
            Back to list
          </Button>
          <ThreadActions
            threadId={threadId}
            email={latestEmail(data.emails)}
          />
          <div className="ml-auto" />
          <ReplyAction email={latestEmail(data.emails)} mode="reply" />
          <ReplyAction email={latestEmail(data.emails)} mode="reply-all" />
          <ReplyAction email={latestEmail(data.emails)} mode="forward" />
        </div>
        <h2 className="mt-2 text-lg leading-snug font-semibold">
          {data.latestSubject}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {data.emails.length} message{data.emails.length > 1 ? "s" : ""} ·{" "}
          {data.participants}
        </p>
      </div>

      <div className="flex-1 space-y-6 px-6 py-5">
        {data.emails.map((email) => (
          <EmailCard key={email.id} email={email} />
        ))}
      </div>

      <InlineComposer />
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
      label: "Move to trash",
      icon: <Trash2 className="size-4" />,
      className: trashIconButtonClassName,
      run: () => setTrashConfirmOpen(true),
    },
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
        onConfirm={() => void trash.mutateAsync([threadId])}
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

  if (!email.id && !email.subject) return null

  const labels: Record<string, { label: string; icon: React.ReactNode }> = {
    reply: { label: "Reply", icon: <MessageSquareReply className="size-4" /> },
    "reply-all": { label: "Reply all", icon: <ReplyAll className="size-4" /> },
    forward: { label: "Forward", icon: <Forward className="size-4" /> },
  }
  const { label, icon } = labels[mode] ?? labels.reply

  const to = (
    mode === "reply" ? email.from : [...(email.from ?? []), ...(email.to ?? [])]
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
          to: dedupe(to),
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

function EmailCard({ email }: { email: EmailProperties }) {
  const [busy, setBusy] = useState(false)
  const downloadAttachment = useDownloadAttachment()
  const subject = email.subject || "(no subject)"
  const time = email.receivedAt ?? email.sentAt
  const attachments = attachmentsOf(email)

  async function download(blobId: string, name?: string) {
    setBusy(true)
    try {
      const blob = await downloadAttachment.mutateAsync(blobId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = name || "attachment"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // ignore download errors
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="rounded-xl border bg-card">
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
      </header>
      <p className="px-4 pt-3 text-sm font-medium">{subject}</p>

      <div
        className="px-4 py-3 text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:whitespace-pre-wrap [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: renderEmailBody(email) }}
      />

      {attachments.length ? (
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          {attachments.map((att, i) => {
            const blobId = att.blobId ?? att.partId ?? undefined
            return (
              <button
                key={`${blobId ?? "att"}-${i}`}
                disabled={busy || !blobId}
                onClick={() => {
                  if (blobId) download(blobId, att.name ?? undefined)
                }}
                className="flex items-center gap-2 rounded-lg border bg-muted/40 px-2.5 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
              >
                <Paperclip className="size-3.5 text-muted-foreground" />
                <span className="max-w-[12rem] truncate">
                  {att.name || "attachment"}
                </span>
                <Download className="size-3.5 text-muted-foreground" />
              </button>
            )
          })}
        </div>
      ) : null}
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
