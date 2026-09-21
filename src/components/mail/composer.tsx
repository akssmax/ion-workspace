/**
 * Compose UI. New messages and reopened drafts open in a docked panel that
 * reuses the inline reply chrome, so composing never takes over the screen.
 */

import { useEffect, useRef, useState } from "react"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import CharacterCount from "@tiptap/extension-character-count"
import {
  Send,
  Trash2,
  Paperclip,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link2,
  MessageSquareReply,
  ReplyAll,
  Forward,
  ChevronDown,
  X,
  Maximize2,
  Minimize2,
  Heading1,
  Heading2,
  Strikethrough,
  Quote,
  Code2,
  Undo2,
  Redo2,
  RemoveFormatting,
  Minus,
  FileText,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "cn"
import {
  useComposerStore,
  type ComposeMode,
  type Recipient,
} from "@/stores/composer.store"
import { useMailStore } from "@/stores/mail.store"
import {
  useIdentities,
  useThread,
  useSendEmail,
  useSaveDraft,
  useUploadAttachment,
  useEmail,
} from "@/queries/mail"
import { useAutocompleteContacts } from "@/queries/contacts"
import type { EmailProperties } from "@/jmap/types/mail"
import { emailTextBody, emailHtmlBody } from "@/lib/html"
import {
  useMailTemplates,
  useSaveMailTemplate,
  useDeleteMailTemplate,
} from "@/queries/mail-templates"
import { usePreferences } from "@/queries/preferences"
import { useMailJobsCapability, useQueueMailSend } from "@/queries/mail-jobs"

function isInlineMode(mode: ComposeMode): boolean {
  return mode === "reply" || mode === "reply-all" || mode === "forward"
}

/**
 * New-message / draft composer. Docked to the bottom-end corner like Gmail's
 * compose window, using the same panel surface as the inline reply composer.
 * Rendered app-wide so Compose shortcut / command palette work in any app.
 */
export function ComposeDock() {
  const open = useComposerStore((s) => s.open)
  const mode = useComposerStore((s) => s.mode)
  const closeCompose = useComposerStore((s) => s.closeCompose)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!open || isInlineMode(mode)) setExpanded(false)
  }, [open, mode])

  if (!open || isInlineMode(mode)) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-end px-3 pb-3 sm:px-4 sm:pb-4">
      <div
        className={cn(
          "pointer-events-auto flex w-full flex-col overflow-hidden rounded-xl border bg-card shadow-lg",
          expanded
            ? "h-[min(85vh,760px)] sm:w-[min(52rem,calc(100vw-2rem))]"
            : "max-h-[min(70vh,640px)] sm:w-[min(42rem,calc(100vw-2rem))]"
        )}
      >
        <div className="flex shrink-0 items-center gap-1 border-b px-3 py-2">
          <span className="truncate text-sm font-medium">
            {mode === "draft" ? "Edit draft" : "New message"}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={expanded ? "Restore size" : "Expand compose"}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Close compose"
              onClick={closeCompose}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
        <ComposerForm variant="dock" />
      </div>
    </div>
  )
}

/**
 * Inline reply / reply-all / forward panel — rendered at the bottom of the
 * reading pane so the original thread stays in context.
 */
export function InlineComposer({ pinned }: { pinned: boolean }) {
  const open = useComposerStore((s) => s.open)
  const mode = useComposerStore((s) => s.mode)
  const closeCompose = useComposerStore((s) => s.closeCompose)
  const updateCompose = useComposerStore((s) => s.updateCompose)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || pinned || !isInlineMode(mode)) return
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [open, pinned, mode])

  if (!open || !isInlineMode(mode)) return null

  const modeMeta: Record<string, { label: string; icon: React.ReactNode }> = {
    reply: {
      label: "Reply",
      icon: <MessageSquareReply className="size-4" />,
    },
    "reply-all": {
      label: "Reply all",
      icon: <ReplyAll className="size-4" />,
    },
    forward: { label: "Forward", icon: <Forward className="size-4" /> },
  }
  const current = modeMeta[mode] ?? modeMeta.reply

  return (
    <div
      ref={panelRef}
      className={cn(
        "mx-4 mb-4 rounded-xl border bg-card shadow-sm sm:mx-6",
        pinned && "max-h-[55%] min-h-0 shrink-0 overflow-y-auto"
      )}
    >
      <div className="flex items-center gap-1 border-b px-3 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="sm" className="gap-1.5 px-2">
                {current.icon}
                {current.label}
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            }
          />
          <DropdownMenuContent align="start">
            {(
              [
                ["reply", "Reply", <MessageSquareReply className="size-3.5" />],
                ["reply-all", "Reply all", <ReplyAll className="size-3.5" />],
                ["forward", "Forward", <Forward className="size-3.5" />],
              ] as const
            ).map(([id, label, icon]) => (
              <DropdownMenuItem
                key={id}
                onClick={() => updateCompose({ mode: id })}
              >
                {icon}
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="ml-auto" />
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Discard"
          onClick={closeCompose}
        >
          <X className="size-4" />
        </Button>
      </div>
      <ComposerForm variant="inline" />
    </div>
  )
}

function ComposerForm({ variant }: { variant: "dock" | "inline" }) {
  const open = useComposerStore((s) => s.open)
  const mode = useComposerStore((s) => s.mode)
  const updateCompose = useComposerStore((s) => s.updateCompose)
  const closeCompose = useComposerStore((s) => s.closeCompose)
  const identityId = useComposerStore((s) => s.identityId)
  const to = useComposerStore((s) => s.to)
  const cc = useComposerStore((s) => s.cc)
  const bcc = useComposerStore((s) => s.bcc)
  const subject = useComposerStore((s) => s.subject)
  const inReplyTo = useComposerStore((s) => s.inReplyTo)
  const references = useComposerStore((s) => s.references)
  const attachments = useComposerStore((s) => s.attachments)
  const draftEmailId = useComposerStore((s) => s.draftEmailId)
  const quotedText = useComposerStore((s) => s.quotedText)
  const setSendState = useComposerStore((s) => s.setSendState)
  const removeAttachment = useComposerStore((s) => s.removeAttachment)
  const addAttachment = useComposerStore((s) => s.addAttachment)
  const inline = variant === "inline"
  const isReply = isInlineMode(mode)

  const identities = useIdentities()
  const { data: preferences } = usePreferences()
  const identity =
    identities.data?.find((item) => item.id === identityId) ??
    identities.data?.find(
      (item) => item.id === preferences?.defaultIdentityId
    ) ??
    identities.data?.[0]
  const uploadAttachment = useUploadAttachment()
  const { available: templatesAvailable, templates } = useMailTemplates()
  const saveTemplate = useSaveMailTemplate()
  const deleteTemplate = useDeleteMailTemplate()

  const focusedThreadId = useMailStore((s) => s.focusedThreadId)
  const thread = useThread(
    mode === "reply" || mode === "reply-all" ? focusedThreadId : null
  )

  // Prefill recipient/subject when replying from a shortcut (no recipients yet).
  // Inline replies skip quoted body — the thread is already on screen.
  const replied = useRef(false)
  useEffect(() => {
    if (!open) {
      replied.current = false
      return
    }
    if (
      (mode === "reply" || mode === "reply-all") &&
      to.length === 0 &&
      thread.data?.emails.length
    ) {
      if (!replied.current) {
        const last = thread.data.emails[thread.data.emails.length - 1]
        replied.current = true
        const own = new Set(
          (identities.data ?? []).map((item) => item.email.toLowerCase())
        )
        const sentByMe = last.from?.some((address) =>
          own.has(address.email.toLowerCase())
        )
        const nextTo =
          mode === "reply-all"
            ? dedupe([
                ...(sentByMe
                  ? []
                  : last.replyTo?.length
                    ? last.replyTo
                    : (last.from ?? [])),
                ...(last.to ?? []),
                ...(last.cc ?? []),
              ]).filter((address) => !own.has(address.email.toLowerCase()))
            : ((sentByMe
                ? last.to
                : last.replyTo?.length
                  ? last.replyTo
                  : last.from) ?? [])
        updateCompose({
          to: nextTo.map((a) => ({ name: a.name, email: a.email })),
          subject: subjectFor(mode, last.subject),
          inReplyTo: last.inReplyTo?.length
            ? last.inReplyTo
            : [last.messageId ?? last.id],
          // Only quote into the body for the modal (new window / no thread).
          quotedText: inline ? undefined : quoteOf(last),
        })
      }
    }
  }, [
    open,
    mode,
    thread.data,
    to.length,
    updateCompose,
    inline,
    identities.data,
  ])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
      Placeholder.configure({
        placeholder: isReply ? "Write a reply…" : "Write your message…",
      }),
      CharacterCount,
    ],
    content: isReply ? "" : (quotedText ?? ""),
    editorProps: {
      attributes: {
        class: cn(
          "prose max-w-none px-3 py-2.5 text-sm whitespace-pre-wrap outline-none [&_p]:m-0 [&_p+_p]:mt-2",
          inline ? "min-h-[140px]" : "min-h-[220px] px-4 py-3"
        ),
      },
    },
  })

  const signatureInserted = useRef(false)
  useEffect(() => {
    if (!open) {
      signatureInserted.current = false
      return
    }
    if (
      !editor ||
      mode === "draft" ||
      signatureInserted.current ||
      !preferences
    )
      return
    signatureInserted.current = true
    const signature =
      preferences.signatures?.[identity?.id ?? ""]?.text ??
      preferences.signatureText
    if (!signature?.trim()) return
    const original = editor.getHTML()
    const safe = signature
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\n", "<br>")
    const signatureHtml = `<p>-- <br>${safe}</p>`
    editor.commands.setContent(
      preferences.signaturePlacement === "below"
        ? `${original}${signatureHtml}`
        : `<p></p>${signatureHtml}${original}`,
      { emitUpdate: true }
    )
  }, [open, editor, mode, preferences, identity?.id])

  useEffect(() => {
    if (inline) return
    if (open && quotedText && editor && editor.isEmpty) {
      editor.commands.setContent(quotedText, { emitUpdate: true })
    }
  }, [open, quotedText, editor, inline])

  const draft = useEmail(mode === "draft" ? draftEmailId : null)
  const draftLoaded = useRef(false)
  useEffect(() => {
    if (!open) {
      draftLoaded.current = false
      return
    }
    if (mode !== "draft" || draftLoaded.current || !draft.data || !editor)
      return
    draftLoaded.current = true
    const d = draft.data
    const toRecipients = (
      addrs?: { name?: string | null; email: string }[] | null
    ) =>
      (addrs ?? []).map((a) => ({ name: a.name ?? undefined, email: a.email }))
    updateCompose({
      to: toRecipients(d.to),
      cc: toRecipients(d.cc),
      bcc: toRecipients(d.bcc),
      subject: d.subject ?? "",
      inReplyTo: d.inReplyTo ?? null,
      references: d.references ?? null,
      identityId:
        identities.data?.find(
          (item) =>
            item.email.toLowerCase() === d.from?.[0]?.email.toLowerCase()
        )?.id ?? null,
    })
    const html = emailHtmlBody(d)
    if (html) editor.commands.setContent(html, { emitUpdate: false })
  }, [open, mode, draft.data, editor, updateCompose])

  const send = useSendEmail()
  const sendLater = useQueueMailSend()
  const requestId = useRef(crypto.randomUUID())
  const jobsCapability = useMailJobsCapability()
  const saveDraft = useSaveDraft()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCc, setShowCc] = useState(false)
  const [showRecipients, setShowRecipients] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("09:00")
  useEffect(() => {
    if (open) requestId.current = crypto.randomUUID()
  }, [open])
  const fileRef = useRef<HTMLInputElement>(null)

  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle")
  const savingRef = useRef(false)
  const pendingSaveRef = useRef(false)

  async function autosave() {
    if (savingRef.current) {
      pendingSaveRef.current = true
      return
    }
    savingRef.current = true
    setSaveState("saving")
    try {
      const state = useComposerStore.getState()
      const id = await saveDraft.mutateAsync({
        draftEmailId: state.draftEmailId,
        to: state.to,
        cc: state.cc,
        bcc: state.bcc,
        from: identity
          ? [{ name: identity.name, email: identity.email ?? identity.name }]
          : undefined,
        subject: state.subject,
        inReplyTo: state.inReplyTo,
        references: state.references,
        htmlBody: editor?.getHTML() ?? "",
        textBody: editor?.getText() ?? "",
        attachments: state.attachments.length ? state.attachments : undefined,
      })
      if (id && id !== state.draftEmailId) {
        updateCompose({ draftEmailId: id })
      }
      setSaveState("saved")
    } catch {
      setSaveState("error")
    } finally {
      savingRef.current = false
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false
        void autosave()
      }
    }
  }

  useEffect(() => {
    if (!open) return
    const hasContent =
      to.length > 0 ||
      subject.trim().length > 0 ||
      (editor ? !editor.isEmpty : false)
    if (!hasContent) return
    const timer = setTimeout(() => void autosave(), 2000)
    return () => clearTimeout(timer)
  }, [to, cc, bcc, subject, open])

  // Body edits also schedule an autosave without re-rendering the whole form.
  const autosaveRef = useRef(autosave)
  autosaveRef.current = autosave
  useEffect(() => {
    if (!editor) return
    let timer: number | undefined
    const handler = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => void autosaveRef.current(), 2000)
    }
    editor.on("update", handler)
    return () => {
      editor.off("update", handler)
      window.clearTimeout(timer)
    }
  }, [editor])

  const canSend = to.length > 0 && !!identity

  async function sendEmail(scheduledFor?: string) {
    if (!identity || to.length === 0) return
    if (
      ![...to, ...cc, ...bcc].every((recipient) =>
        isValidEmail(recipient.email)
      )
    ) {
      setError("Check the recipient addresses before sending.")
      return
    }
    setBusy(true)
    setError(null)
    setSendState("sending")
    try {
      const html = editor?.getHTML() ?? ""
      const text = editor?.getText() ?? ""
      const input = {
        identityId: identity.id,
        from: [{ name: identity.name, email: identity.email ?? identity.name }],
        to: to,
        cc: cc,
        bcc: bcc,
        subject: subject || null,
        htmlBody: html,
        textBody: text,
        inReplyTo: inReplyTo ?? undefined,
        references: references ?? undefined,
        attachments: attachments.length ? attachments : undefined,
        draftId: draftEmailId,
      }
      if (jobsCapability.data) {
        await sendLater.mutateAsync({
          input,
          scheduledFor,
          requestId: requestId.current,
        })
        setSendState("queued")
      } else {
        await send.mutateAsync(input)
        setSendState("sent")
      }
      setScheduleOpen(false)
      closeCompose()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send the message."
      setSendState("failed", message)
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const ccVisible = showCc || cc.length > 0 || bcc.length > 0

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col",
        inline ? "" : "flex-1 overflow-y-auto"
      )}
    >
      {identities.data && identities.data.length > 1 ? (
        <div className="flex items-center gap-2 border-b px-4 py-2 text-sm">
          <Label
            htmlFor="compose-from"
            className="w-9 shrink-0 text-xs text-muted-foreground uppercase"
          >
            From
          </Label>
          <Select
            value={identity?.id ?? identities.data[0]?.id}
            onValueChange={(value) => {
              if (typeof value === "string")
                updateCompose({ identityId: value })
            }}
          >
            <SelectTrigger id="compose-from" className="min-w-0 flex-1">
              <SelectValue>
                {identity
                  ? `${identity.name} <${identity.email}>`
                  : "Choose identity"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {identities.data.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} &lt;{item.email}&gt;
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {isReply && to.length > 0 && !showRecipients ? (
        <button
          type="button"
          className="flex min-h-12 items-center gap-2 border-b px-4 text-left text-sm hover:bg-muted/30"
          onClick={() => setShowRecipients(true)}
        >
          <span className="w-9 shrink-0 text-xs text-muted-foreground uppercase">
            To
          </span>
          <span className="min-w-0 flex-1 truncate">
            {to.map((r) => r.name || r.email).join(", ")}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      ) : (
        <div className="flex items-start gap-2 border-b px-4 py-2">
          <RecipientField
            className="min-w-0 flex-1"
            label="To"
            value={to}
            onChange={(next) => updateCompose({ to: next })}
            placeholder="Recipients"
            autoFocus={!isReply}
          />
          {!ccVisible ? (
            <button
              type="button"
              className="shrink-0 py-0.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowCc(true)}
            >
              Cc Bcc
            </button>
          ) : null}
        </div>
      )}
      {ccVisible ? (
        <>
          <div className="border-b px-4 py-2">
            <RecipientField
              label="Cc"
              value={cc}
              onChange={(next) => updateCompose({ cc: next })}
            />
          </div>
          <div className="border-b px-4 py-2">
            <RecipientField
              label="Bcc"
              value={bcc}
              onChange={(next) => updateCompose({ bcc: next })}
            />
          </div>
        </>
      ) : null}

      {!isReply || mode === "forward" ? (
        <div className="border-b px-4 py-2">
          <Label htmlFor="compose-subject" className="sr-only">
            Subject
          </Label>
          <Input
            id="compose-subject"
            placeholder="Subject"
            value={subject}
            onChange={(e) => updateCompose({ subject: e.target.value })}
            className="h-auto rounded-none border-0 bg-transparent px-0 py-0.5 shadow-none focus-visible:ring-0"
          />
        </div>
      ) : null}

      <div
        className={cn(
          "min-h-40 flex-1",
          inline ? "min-h-48" : "min-h-[260px] overflow-y-auto"
        )}
      >
        {editor ? <EditorContent editor={editor} /> : null}
      </div>

      <div className="mx-4 flex min-w-0 items-center gap-2 rounded-lg bg-muted/50 p-1">
        <FormattingToolbar editor={editor}>
          <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            {saveState === "saving" ? (
              <span>Saving draft…</span>
            ) : saveState === "saved" ? (
              <span>Draft saved</span>
            ) : saveState === "error" ? (
              <span className="text-destructive">Couldn&apos;t save draft</span>
            ) : null}
          </span>
        </FormattingToolbar>
      </div>
      {identity?.htmlSignature || identity?.textSignature ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .insertContent(
                identity.htmlSignature || identity.textSignature || ""
              )
              .run()
          }
        >
          Insert signature
        </Button>
      ) : null}

      {attachments.length ? (
        <div className="flex flex-wrap gap-2 px-5 py-2">
          {attachments.map((att) => (
            <span
              key={att.blobId}
              className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1 text-xs"
            >
              <Paperclip className="size-3.5" />
              {att.fileName ?? att.name ?? "attachment"}
              <button
                onClick={() => removeAttachment(att.blobId)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${att.fileName ?? "attachment"}`}
              >
                <Trash2 className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {error ? <p className="px-5 text-sm text-destructive">{error}</p> : null}

      <div
        className={cn(
          "sticky bottom-0 flex flex-wrap items-center gap-2 border-t bg-card px-4 py-3"
        )}
      >
        <Button
          className="rounded-full px-5"
          onClick={() => void sendEmail()}
          disabled={!canSend || busy}
        >
          {busy ? (
            "Sending…"
          ) : (
            <>
              <Send className="size-4" />
              Send
            </>
          )}
        </Button>
        {jobsCapability.data ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={!canSend || busy}
              onClick={() => setScheduleOpen(true)}
            >
              Send later
            </Button>
            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Schedule message</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  A copy of this message will be queued. Cancel it in Outbox
                  before editing the draft.
                </p>
                <div className="grid gap-3">
                  <Label htmlFor="send-date">Date</Label>
                  <DatePicker
                    id="send-date"
                    value={scheduleDate}
                    onChange={setScheduleDate}
                  />
                  <Label htmlFor="send-time">Time</Label>
                  <Input
                    id="send-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(event) => setScheduleTime(event.target.value)}
                  />
                  <Button
                    disabled={
                      busy ||
                      !scheduleDate ||
                      !scheduleTime ||
                      new Date(`${scheduleDate}T${scheduleTime}`).getTime() <
                        Date.now() + 60_000
                    }
                    onClick={() =>
                      void sendEmail(
                        new Date(
                          `${scheduleDate}T${scheduleTime}`
                        ).toISOString()
                      )
                    }
                  >
                    Schedule send
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : null}
        {jobsCapability.data === false ? (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Scheduling unavailable
          </span>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={async (e) => {
            const files = [...(e.target.files ?? [])]
            e.target.value = ""
            setBusy(true)
            try {
              for (const file of files) {
                const blob = await uploadAttachment.mutateAsync(file)
                addAttachment({
                  ...blob,
                  fileName: file.name,
                  name: file.name,
                })
              }
            } catch {
              setError("One or more attachments failed to upload.")
            } finally {
              setBusy(false)
            }
          }}
        />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Attach files"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
              />
            }
          >
            <Paperclip className="size-4" />
          </TooltipTrigger>
          <TooltipContent>Attach files</TooltipContent>
        </Tooltip>
        {templatesAvailable ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" type="button" />}
            >
              <FileText className="size-4" /> Templates
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {templates.map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  onClick={() => {
                    if (
                      (!editor?.isEmpty || subject) &&
                      !window.confirm(
                        "Replace the current subject and message with this template?"
                      )
                    )
                      return
                    updateCompose({ subject: template.subject })
                    editor?.commands.setContent(template.htmlBody)
                  }}
                >
                  {template.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onClick={async () => {
                  const name = window.prompt("Template name")?.trim()
                  if (!name) return
                  try {
                    await saveTemplate.mutateAsync({
                      name,
                      subject: subject,
                      htmlBody: editor?.getHTML() ?? "",
                    })
                  } catch (cause) {
                    setError(
                      cause instanceof Error
                        ? cause.message
                        : "Could not save template."
                    )
                  }
                }}
              >
                Save message as template
              </DropdownMenuItem>
              {templates.length ? (
                <DropdownMenuItem
                  onClick={async () => {
                    const selected = window
                      .prompt("Name of template to delete")
                      ?.trim()
                    const match = templates.find(
                      (template) => template.name === selected
                    )
                    if (match) await deleteTemplate.mutateAsync(match.id)
                  }}
                >
                  Delete a template…
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Discard message"
                onClick={closeCompose}
                className="ml-auto"
              />
            }
          >
            <Trash2 className="size-4" />
          </TooltipTrigger>
          <TooltipContent>Discard message</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

/**
 * Recipient field with contact autocomplete: type a partial address, hit
 * Enter/Tab or click a suggestion to add a chip.
 */
function RecipientField({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
  className,
}: {
  label: string
  value: Recipient[]
  onChange: (recipients: Recipient[]) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}) {
  const [text, setText] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [query, setQuery] = useState("")
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(text.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [text])
  const suggestions = useAutocompleteContacts(query)

  const remove = (email: string) =>
    onChange(value.filter((r) => r.email !== email))

  const commit = (input: string) => {
    const parsed = parseRecipients(input)
    const tokens = input
      .split(/[,;]/)
      .map((token) => token.trim())
      .filter(Boolean)
    if (tokens.length && parsed.length !== tokens.length) {
      setInvalid(true)
      return
    }
    if (parsed.length) {
      onChange(
        [...value, ...parsed].filter(
          (recipient, index, list) =>
            list.findIndex(
              (item) =>
                item.email.toLowerCase() === recipient.email.toLowerCase()
            ) === index
        )
      )
      setText("")
      setInvalid(false)
    }
  }

  const ok = value.length ? true : null

  return (
    <div className={cn("min-w-0", className)}>
      <Label className="sr-only">{label}</Label>
      <div className="flex flex-wrap items-center gap-1.5 px-0.5">
        <span className="w-9 shrink-0 text-xs text-muted-foreground uppercase">
          {label}
        </span>
        {value.map((r) => (
          <span
            key={r.email}
            className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
          >
            {r.name || r.email}
            <button
              type="button"
              onClick={() => remove(r.email)}
              aria-label={`Remove ${r.email}`}
              className="text-primary/60 hover:text-primary"
            >
              <Trash2 className="size-3" />
            </button>
          </span>
        ))}
        <div className="relative min-w-[8rem] flex-1">
          <input
            autoFocus={autoFocus}
            className="w-full bg-transparent text-sm outline-none"
            placeholder={ok ? "" : (placeholder ?? "recipients…")}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setInvalid(false)
              setShowSuggestions(true)
            }}
            onBlur={() => {
              setShowSuggestions(false)
              if (text.trim()) commit(text)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault()
                commit(text)
              } else if (e.key === "Tab" && text.trim()) {
                commit(text)
              } else if (e.key === "Backspace" && !text && value.length) {
                onChange(value.slice(0, -1))
              }
            }}
          />
          {showSuggestions && suggestions.data?.length ? (
            <div className="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-lg border bg-popover shadow-lg">
              {suggestions.data.map((c) => {
                const primary =
                  c.emails?.find((em) => em.isDefault) ?? c.emails?.[0]
                return (
                  <button
                    key={c.id}
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      if (primary)
                        onChange([
                          ...value,
                          { name: c.fn ?? undefined, email: primary.value },
                        ])
                      setText("")
                      setShowSuggestions(false)
                    }}
                  >
                    <span className="font-medium">{c.fn || "Unknown"}</span>
                    {primary ? (
                      <span className="text-xs text-muted-foreground">
                        {primary.value}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
      {invalid ? (
        <p role="alert" className="mt-1 text-xs text-destructive">
          Enter a valid email address.
        </p>
      ) : null}
    </div>
  )
}

function parseRecipients(input: string): Recipient[] {
  const out: Recipient[] = []
  const tokens = input.split(/[,;]/)
  for (const raw of tokens) {
    const token = raw.trim()
    if (!token) continue
    const email = token.match(/(?:^|<)([^\s<>]+@[^\s<>]+)(?:>|$)/)?.[1]
    if (email && isValidEmail(email)) {
      const name = token
        .replace(email, "")
        .replace(/[<>()]/g, "")
        .trim()
      out.push(name ? { name, email } : { email })
    }
  }
  return out
}

function isValidEmail(value: string): boolean {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)
}

function subjectFor(mode: string, subject?: string | null): string {
  const base = subject || ""
  if (mode === "forward") {
    return /^\s*fw:/i.test(base) ? base : `Fwd: ${base}`
  }
  if (mode === "reply" || mode === "reply-all") {
    return /^\s*re:/i.test(base) ? base : `Re: ${base}`
  }
  return base
}

function quoteOf(email: EmailProperties): string {
  const from = email.from?.[0]
  const who = from?.name || from?.email || "Unknown"
  const line = `On ${email.receivedAt ?? email.sentAt ?? ""}, ${who} wrote:`
  const text = emailTextBody(email)
  const block = text
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n")
  return `<blockquote><p>${line}</p></blockquote><p></p>${block}`.replace(
    /\n/g,
    "<br/>"
  )
}

function dedupe<T extends { email?: string | null }>(addrs: T[]): T[] {
  const seen = new Set<string>()
  return addrs.filter((a) => {
    if (!a.email) return false
    const key = a.email.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Formatting toolbar + word count. Kept separate from `ComposerForm` and driven
 * by editor transactions so typing re-renders only this strip, not the form.
 */
function FormattingToolbar({
  editor,
  children,
}: {
  editor: Editor | null
  children?: React.ReactNode
}) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!editor) return
    const bump = () => setTick((t) => t + 1)
    editor.on("transaction", bump)
    return () => {
      editor.off("transaction", bump)
    }
  }, [editor])

  const tools = [
    {
      label: "Heading 1",
      icon: <Heading1 className="size-4" />,
      active: editor?.isActive("heading", { level: 1 }),
      run: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: "Heading 2",
      icon: <Heading2 className="size-4" />,
      active: editor?.isActive("heading", { level: 2 }),
      run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Bold",
      icon: <Bold className="size-4" />,
      active: editor?.isActive("bold"),
      run: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: <Italic className="size-4" />,
      active: editor?.isActive("italic"),
      run: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: "Underline",
      icon: <UnderlineIcon className="size-4" />,
      active: editor?.isActive("underline"),
      run: () => editor?.chain().focus().toggleUnderline().run(),
    },
    {
      label: "Strikethrough",
      icon: <Strikethrough className="size-4" />,
      active: editor?.isActive("strike"),
      run: () => editor?.chain().focus().toggleStrike().run(),
    },
    {
      label: "Bulleted list",
      icon: <List className="size-4" />,
      active: editor?.isActive("bulletList"),
      run: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      icon: <ListOrdered className="size-4" />,
      active: editor?.isActive("orderedList"),
      run: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Quote",
      icon: <Quote className="size-4" />,
      active: editor?.isActive("blockquote"),
      run: () => editor?.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "Inline code",
      icon: <Code2 className="size-4" />,
      active: editor?.isActive("code"),
      run: () => editor?.chain().focus().toggleCode().run(),
    },
    {
      label: "Horizontal rule",
      icon: <Minus className="size-4" />,
      active: false,
      run: () => editor?.chain().focus().setHorizontalRule().run(),
    },
    {
      label: "Link",
      icon: <Link2 className="size-4" />,
      active: editor?.isActive("link"),
      run: () => {
        if (!editor) return
        if (editor.isActive("link")) {
          editor.chain().focus().unsetLink().run()
          return
        }
        const url = window.prompt("Link URL")
        if (url) editor.chain().focus().setLink({ href: url }).run()
      },
    },
    {
      label: "Clear formatting",
      icon: <RemoveFormatting className="size-4" />,
      active: false,
      run: () => editor?.chain().focus().unsetAllMarks().clearNodes().run(),
    },
    {
      label: "Undo",
      icon: <Undo2 className="size-4" />,
      active: false,
      run: () => editor?.chain().focus().undo().run(),
    },
    {
      label: "Redo",
      icon: <Redo2 className="size-4" />,
      active: false,
      run: () => editor?.chain().focus().redo().run(),
    },
  ]

  const wordCount =
    editor?.getText().trim().split(/\s+/).filter(Boolean).length ?? 0

  return (
    <>
      <div
        role="toolbar"
        aria-label="Message formatting"
        className="flex min-w-0 flex-1 flex-wrap items-center gap-0.5"
      >
        {tools.map((tool) => (
          <Tooltip key={tool.label}>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-8"
                  aria-label={tool.label}
                  aria-pressed={!!tool.active}
                  onClick={tool.run}
                />
              }
            >
              {tool.icon}
            </TooltipTrigger>
            <TooltipContent>{tool.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      {children}
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {wordCount} words
      </span>
    </>
  )
}
