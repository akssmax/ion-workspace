/**
 * Compose UI: modal for new/draft messages; inline panel for reply /
 * reply-all / forward so the thread stays in view.
 */

import { useEffect, useRef, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
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
  Save,
  MessageSquareReply,
  ReplyAll,
  Forward,
  ChevronDown,
  X,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

function isInlineMode(mode: ComposeMode): boolean {
  return mode === "reply" || mode === "reply-all" || mode === "forward"
}

/** Modal composer for new messages and reopened drafts. */
export function ComposeDialog() {
  const open = useComposerStore((s) => s.open)
  const mode = useComposerStore((s) => s.mode)
  const closeCompose = useComposerStore((s) => s.closeCompose)

  if (!open || isInlineMode(mode)) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeCompose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "draft" ? "Edit draft" : "New message"}
          </DialogTitle>
        </DialogHeader>
        <ComposerForm variant="dialog" />
      </DialogContent>
    </Dialog>
  )
}

/**
 * Inline reply / reply-all / forward panel — rendered at the bottom of the
 * reading pane so the original thread stays in context.
 */
export function InlineComposer() {
  const open = useComposerStore((s) => s.open)
  const mode = useComposerStore((s) => s.mode)
  const closeCompose = useComposerStore((s) => s.closeCompose)
  const updateCompose = useComposerStore((s) => s.updateCompose)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !isInlineMode(mode)) return
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [open, mode])

  if (!open || !isInlineMode(mode)) return null

  const modeMeta: Record<
    string,
    { label: string; icon: React.ReactNode }
  > = {
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
      className="mx-6 mb-6 overflow-hidden rounded-xl border bg-card shadow-sm"
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
      <div className="p-3">
        <ComposerForm variant="inline" />
      </div>
    </div>
  )
}

function ComposerForm({ variant }: { variant: "dialog" | "inline" }) {
  const composer = useComposerStore()
  const { open, mode, updateCompose, closeCompose } = composer
  const inline = variant === "inline"

  const identities = useIdentities()
  const identity = identities.data?.[0]
  const uploadAttachment = useUploadAttachment()

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
      composer.to.length === 0 &&
      thread.data?.emails.length
    ) {
      if (!replied.current) {
        const last = thread.data.emails[thread.data.emails.length - 1]
        replied.current = true
        const to =
          mode === "reply-all"
            ? dedupe([...(last.from ?? []), ...(composer.to ?? [])])
            : (last.from ?? [])
        updateCompose({
          to: to.map((a) => ({ name: a.name, email: a.email })),
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
    composer.to.length,
    updateCompose,
    inline,
  ])

  const [editTick, setEditTick] = useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
      Placeholder.configure({
        placeholder: inline
          ? "Write a reply…"
          : "Write your message…",
      }),
      CharacterCount,
    ],
    content: inline ? "" : (composer.quotedText ?? ""),
    onUpdate: () => setEditTick((t) => t + 1),
    editorProps: {
      attributes: {
        class: cn(
          "prose max-w-none px-3 py-2.5 text-sm outline-none whitespace-pre-wrap [&_p]:m-0 [&_p+_p]:mt-2",
          inline ? "min-h-[140px]" : "min-h-[220px] px-4 py-3"
        ),
      },
    },
  })

  useEffect(() => {
    if (inline) return
    if (open && composer.quotedText && editor && editor.isEmpty) {
      editor.commands.setContent(composer.quotedText, { emitUpdate: true })
    }
  }, [open, composer.quotedText, editor, inline])

  const draft = useEmail(mode === "draft" ? composer.draftEmailId : null)
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
    })
    const html = emailHtmlBody(d)
    if (html) editor.commands.setContent(html, { emitUpdate: false })
  }, [open, mode, draft.data, editor, updateCompose])

  const send = useSendEmail()
  const saveDraft = useSaveDraft()
  const [busy, setBusy] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
      composer.to.length > 0 ||
      composer.subject.trim().length > 0 ||
      (editor ? !editor.isEmpty : false)
    if (!hasContent) return
    const timer = setTimeout(() => void autosave(), 2000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTick, composer.to, composer.cc, composer.bcc, composer.subject, open])

  const wordCount =
    editor?.getText().trim().split(/\s+/).filter(Boolean).length ?? 0

  const canSend = composer.to.length > 0 && !!identity

  async function sendEmail() {
    if (!identity || composer.to.length === 0) return
    setBusy(true)
    setError(null)
    composer.setSendState("sending")
    try {
      const html = editor?.getHTML() ?? ""
      const text = editor?.getText() ?? ""
      await send.mutateAsync({
        identityId: identity.id,
        from: [{ name: identity.name, email: identity.email ?? identity.name }],
        to: composer.to,
        cc: composer.cc,
        bcc: composer.bcc,
        subject: composer.subject || null,
        htmlBody: html,
        textBody: text,
        inReplyTo: composer.inReplyTo ?? undefined,
        references: composer.references ?? undefined,
        attachments: composer.attachments.length
          ? composer.attachments
          : undefined,
        draftId: composer.draftEmailId,
      })
      composer.setSendState("sent")
      closeCompose()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send the message."
      composer.setSendState("failed", message)
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  async function storeDraft() {
    setSaveBusy(true)
    setError(null)
    try {
      const html = editor?.getHTML() ?? ""
      const text = editor?.getText() ?? ""
      const id = await saveDraft.mutateAsync({
        draftEmailId: composer.draftEmailId,
        to: composer.to,
        cc: composer.cc,
        bcc: composer.bcc,
        from: identity
          ? [{ name: identity.name, email: identity.email ?? identity.name }]
          : undefined,
        subject: composer.subject,
        htmlBody: html,
        textBody: text,
        attachments: composer.attachments.length
          ? composer.attachments
          : undefined,
      })
      if (id) updateCompose({ draftEmailId: id })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save the draft.")
    } finally {
      setSaveBusy(false)
    }
  }

  const showCc = (composer.cc?.length ?? 0) > 0 || (composer.bcc?.length ?? 0) > 0

  return (
    <div className="space-y-3">
      <RecipientField
        label="To"
        value={composer.to}
        onChange={(to) => updateCompose({ to })}
        placeholder="recipients…"
      />
      {showCc ? (
        <>
          <RecipientField
            label="Cc"
            value={composer.cc ?? []}
            onChange={(cc) => updateCompose({ cc })}
          />
          <RecipientField
            label="Bcc"
            value={composer.bcc ?? []}
            onChange={(bcc) => updateCompose({ bcc })}
          />
        </>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-muted-foreground"
        onClick={() => {
          updateCompose({
            cc: showCc ? undefined : [],
            bcc: showCc ? undefined : composer.bcc?.length ? composer.bcc : [],
          })
        }}
      >
        {showCc ? "Hide Cc/Bcc" : "Add Cc/Bcc"}
      </Button>

      {!inline || mode === "forward" ? (
        <div className="pt-0.5">
          <Label htmlFor="compose-subject" className="sr-only">
            Subject
          </Label>
          <Input
            id="compose-subject"
            placeholder="Subject"
            value={composer.subject}
            onChange={(e) => updateCompose({ subject: e.target.value })}
          />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border">
        {editor ? <EditorContent editor={editor} /> : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="size-8 p-0"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="size-8 p-0"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="size-8 p-0"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="size-8 p-0"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="size-8 p-0"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="size-8 p-0"
          onClick={() => {
            const url = window.prompt("Link URL")
            if (url) editor?.chain().focus().setLink({ href: url }).run()
          }}
        >
          <Link2 className="size-3.5" />
        </Button>
        <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {saveState === "saving" ? (
            <span>Saving draft…</span>
          ) : saveState === "saved" ? (
            <span>Draft saved</span>
          ) : saveState === "error" ? (
            <span className="text-destructive">Couldn&apos;t save draft</span>
          ) : null}
          <span>{wordCount} words</span>
        </span>
      </div>

      {composer.attachments.length ? (
        <div className="flex flex-wrap gap-2">
          {composer.attachments.map((att) => (
            <span
              key={att.blobId}
              className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1 text-xs"
            >
              <Paperclip className="size-3.5" />
              {att.fileName ?? att.name ?? "attachment"}
              <button
                onClick={() => composer.removeAttachment(att.blobId)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${att.fileName ?? "attachment"}`}
              >
                <Trash2 className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <Button onClick={() => void sendEmail()} disabled={!canSend || busy}>
          {busy ? (
            "Sending…"
          ) : (
            <>
              <Send className="size-4" />
              Send
            </>
          )}
        </Button>
        {!inline ? (
          <Button
            variant="outline"
            onClick={() => void storeDraft()}
            disabled={saveBusy}
          >
            {saveBusy ? (
              "Saving…"
            ) : (
              <>
                <Save className="size-4" />
                Save draft
              </>
            )}
          </Button>
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
                composer.addAttachment({
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          <Paperclip className="size-4" />
          Attach
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={closeCompose}
          className="ml-auto"
        >
          Discard
        </Button>
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
}: {
  label: string
  value: Recipient[]
  onChange: (recipients: Recipient[]) => void
  placeholder?: string
}) {
  const [text, setText] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestions = useAutocompleteContacts(text)

  const remove = (email: string) =>
    onChange(value.filter((r) => r.email !== email))

  const commit = (input: string) => {
    const parsed = parseRecipients(input)
    if (parsed.length) {
      onChange([...value, ...parsed])
      setText("")
    }
  }

  const ok = value.length ? true : null

  return (
    <div>
      <Label className="sr-only">{label}</Label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-background px-2 py-1.5">
        <span className="w-8 shrink-0 text-right text-xs text-muted-foreground uppercase">
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
            className="w-full bg-transparent text-sm outline-none"
            placeholder={ok ? "" : (placeholder ?? "recipients…")}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setShowSuggestions(true)
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
                e.preventDefault()
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
    </div>
  )
}

function parseRecipients(input: string): Recipient[] {
  const out: Recipient[] = []
  const tokens = input.split(/[,;]/)
  for (const raw of tokens) {
    const token = raw.trim()
    if (!token) continue
    const email = token.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)?.[0]
    if (email) {
      const name = token
        .replace(email, "")
        .replace(/[<>()]/g, "")
        .trim()
      out.push(name ? { name, email } : { email })
    }
  }
  return out
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
