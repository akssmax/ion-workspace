import { useEffect, useState } from "react"
import { RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { usePreferences, useSavePreferences } from "@/queries/preferences"
import { useCreateMailbox, useDeleteMailbox, useIdentities, useMailboxes, useRenameMailbox, useUpdateIdentity } from "@/queries/mail"
import { useDeleteMailTemplate, useMailTemplates, useSaveMailTemplate } from "@/queries/mail-templates"
import { filenameDefaults, formatMailFilename, type FilenameKind } from "@/lib/mail-filenames"
import { SaveState } from "./settings-page"
import { useSaveVacationResponse, useVacationResponse, type VacationResponse } from "@/queries/mail-vacation"
import { useMailFilters, useSaveMailFilters } from "@/queries/mail-filters"

export function ComposingSection() {
  const { data: prefs } = usePreferences()
  const save = useSavePreferences()
  const identities = useIdentities()
  return <div className="space-y-5">
    <label className="block space-y-1 text-sm font-medium">Default sending identity
      <select className="w-full rounded-lg border bg-background p-2" value={prefs?.defaultIdentityId ?? ""} onChange={event => void save.mutateAsync({ defaultIdentityId: event.target.value })}>
        <option value="">First available identity</option>
        {(identities.data ?? []).map(identity => <option key={identity.id} value={identity.id}>{identity.name} &lt;{identity.email}&gt;</option>)}
      </select>
    </label>
    <label className="block space-y-1 text-sm font-medium">Reply default
      <select className="w-full rounded-lg border bg-background p-2" value={prefs?.replyDefault ?? "reply"} onChange={event => void save.mutateAsync({ replyDefault: event.target.value as "reply" | "reply-all" })}>
        <option value="reply">Reply to sender</option><option value="reply-all">Reply to everyone</option>
      </select>
    </label>
    <label className="block space-y-1 text-sm font-medium">Signature placement
      <select className="w-full rounded-lg border bg-background p-2" value={prefs?.signaturePlacement ?? "above"} onChange={event => void save.mutateAsync({ signaturePlacement: event.target.value as "above" | "below" })}>
        <option value="above">Above quoted text</option><option value="below">Below quoted text</option>
      </select>
    </label>
    <label className="block space-y-1 text-sm font-medium">Default signature
      <Textarea value={prefs?.signatureText ?? ""} onChange={event => void save.mutateAsync({ signatureText: event.target.value })} placeholder="Your signature" />
    </label>
    <SaveState isSaving={save.isPending} isError={save.isError} />
  </div>
}

const sample = { date: new Date(2026, 4, 22, 19, 35, 33), from: "Alice Sender", to: "Bob Recipient", subject: "Project update", filename: "Invoice-2026-05.pdf", count: 3 }
const fields: { kind: FilenameKind; title: string; key: "emlFilenameTemplate" | "attachmentFilenameTemplate" | "zipFilenameTemplate"; tokens: string[] }[] = [
  { kind: "eml", title: "Email (.eml) filename", key: "emlFilenameTemplate", tokens: ["date", "date_short", "time", "from", "to", "subject"] },
  { kind: "attachment", title: "Attachment filename", key: "attachmentFilenameTemplate", tokens: ["date", "from", "subject", "filename", "name", "ext"] },
  { kind: "zip", title: "Multi-email ZIP filename", key: "zipFilenameTemplate", tokens: ["count", "date", "date_short", "time"] },
]

export function DownloadsSection() {
  const { data: prefs } = usePreferences()
  const save = useSavePreferences()
  return <div className="space-y-7">
    {fields.map(field => {
      const value = prefs?.[field.key] ?? filenameDefaults[field.kind]
      return <section key={field.kind} className="space-y-2 border-b pb-6">
        <label htmlFor={`download-${field.kind}`} className="text-sm font-medium">{field.title}</label>
        <div className="flex gap-2"><Input id={`download-${field.kind}`} value={value} onChange={event => void save.mutateAsync({ [field.key]: event.target.value })} /><Button variant="outline" size="icon" aria-label={`Reset ${field.title}`} onClick={() => void save.mutateAsync({ [field.key]: filenameDefaults[field.kind] })}><RotateCcw className="size-4" /></Button></div>
        <div className="flex flex-wrap gap-1">{field.tokens.map(token => <button type="button" key={token} className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground hover:bg-muted" onClick={() => void save.mutateAsync({ [field.key]: `${value}{${token}}` })}>{`{${token}}`}</button>)}</div>
        <p className="break-all text-xs text-muted-foreground">Preview: {formatMailFilename(field.kind, value, sample, prefs?.filenameSpaces)}</p>
      </section>
    })}
    <label className="flex items-center justify-between gap-4 text-sm font-medium">Spaces in file names
      <select className="rounded-lg border bg-background p-2" value={prefs?.filenameSpaces ?? "keep"} onChange={event => void save.mutateAsync({ filenameSpaces: event.target.value as "keep" | "dash" | "underscore" })}><option value="keep">Keep spaces</option><option value="dash">Use dashes</option><option value="underscore">Use underscores</option></select>
    </label>
    <SaveState isSaving={save.isPending} isError={save.isError} />
  </div>
}

export function ContentSection() {
  const { data: prefs } = usePreferences()
  const save = useSavePreferences()
  return <div className="space-y-5">
    <label className="block space-y-1 text-sm font-medium">Remote images
      <select className="w-full rounded-lg border bg-background p-2" value={prefs?.remoteImages ?? "never"} onChange={event => void save.mutateAsync({ remoteImages: event.target.value as "never" | "trusted" | "always" })}>
        <option value="never">Ask before loading</option><option value="trusted">Load for trusted senders</option><option value="always">Always load</option>
      </select>
    </label>
    <label className="block space-y-1 text-sm font-medium">Trusted image senders
      <Textarea value={(prefs?.trustedImageSenders ?? []).join("\n")} onChange={event => void save.mutateAsync({ trustedImageSenders: event.target.value.split("\n").map(item => item.trim().toLowerCase()).filter(Boolean) })} placeholder="One email address per line" />
    </label>
    <p className="text-xs text-muted-foreground">Email HTML is always sanitized before display. This control only changes when remote images are loaded.</p>
    <SaveState isSaving={save.isPending} isError={save.isError} />
  </div>
}

export function IdentitiesSection() {
  const identities = useIdentities()
  const update = useUpdateIdentity()
  return <div className="space-y-3">{identities.isLoading ? <p>Loading identities…</p> : identities.isError ? <p className="text-destructive">Could not load identities from the mail server.</p> : (identities.data ?? []).map(identity => <div key={identity.id} className="rounded-xl border p-3"><p className="font-medium">{identity.name || identity.email}</p><p className="text-sm text-muted-foreground">{identity.email}</p><Button variant="outline" size="sm" className="mt-2" onClick={() => { const name = window.prompt("Display name", identity.name); if (name?.trim() && name !== identity.name) void update.mutateAsync({ id: identity.id, name: name.trim() }) }}>Edit display name</Button></div>)}{update.isError ? <p role="alert" className="text-sm text-destructive">The server rejected the identity change.</p> : null}<p className="text-xs text-muted-foreground">These addresses come from your mail server. Choose the default in Composing.</p></div>
}

export function FoldersSection({ tags }: { tags: boolean }) {
  const { data: mailboxes, isError } = useMailboxes()
  const create = useCreateMailbox(), rename = useRenameMailbox(), remove = useDeleteMailbox()
  const [name, setName] = useState("")
  const custom = (mailboxes ?? []).filter(mailbox => !mailbox.role)
  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">{tags ? "Labels are stored as JMAP mailbox memberships, so a message can have several." : "Folders are managed by the connected mail server."}</p>
    <form className="flex gap-2" onSubmit={event => { event.preventDefault(); if (name.trim()) void create.mutateAsync(name.trim()).then(() => setName("")) }}><Input aria-label="New folder name" value={name} onChange={event => setName(event.target.value)} placeholder="New folder name" /><Button type="submit" disabled={!name.trim()}>Create</Button></form>
    {isError ? <p className="text-sm text-destructive">Could not load folders.</p> : custom.map(mailbox => <div key={mailbox.id} className="flex items-center gap-2 rounded-lg border p-2"><span className="min-w-0 flex-1 truncate text-sm">{mailbox.name}</span><Button variant="ghost" size="sm" onClick={() => { const next = window.prompt("Rename folder", mailbox.name); if (next?.trim() && next !== mailbox.name) void rename.mutateAsync({ id: mailbox.id, name: next.trim() }) }}>Rename</Button><Button variant="ghost" size="icon-sm" aria-label={`Delete ${mailbox.name}`} onClick={() => { if (window.confirm(`Delete ${mailbox.name}?`)) void remove.mutateAsync(mailbox.id) }}><Trash2 className="size-4" /></Button></div>)}
    {(create.isError || rename.isError || remove.isError) ? <p className="text-sm text-destructive">The mail server rejected this folder change.</p> : null}
  </div>
}

export function TemplatesSection() {
  const { available, templates } = useMailTemplates()
  const save = useSaveMailTemplate(), remove = useDeleteMailTemplate()
  const [name, setName] = useState(""), [subject, setSubject] = useState(""), [body, setBody] = useState("")
  if (!available) return <p className="text-sm text-muted-foreground">Templates require the app metadata database. Configure DATABASE_URL and run the mail migrations.</p>
  return <div className="space-y-4"><form className="space-y-2" onSubmit={event => { event.preventDefault(); if (name.trim()) void save.mutateAsync({ name: name.trim(), subject, htmlBody: body }).then(() => { setName(""); setSubject(""); setBody("") }) }}><Input aria-label="Template name" placeholder="Template name" value={name} onChange={event => setName(event.target.value)} /><Input aria-label="Template subject" placeholder="Subject" value={subject} onChange={event => setSubject(event.target.value)} /><Textarea aria-label="Template body" placeholder="Message body" value={body} onChange={event => setBody(event.target.value)} /><Button type="submit" disabled={!name.trim()}>Save template</Button></form>{templates.map(template => <div key={template.id} className="flex items-center gap-2 rounded-lg border p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{template.name}</p><p className="truncate text-xs text-muted-foreground">{template.subject}</p></div><Button variant="ghost" size="icon-sm" aria-label={`Delete ${template.name}`} onClick={() => void remove.mutateAsync(template.id)}><Trash2 className="size-4" /></Button></div>)}</div>
}

export function VacationSection() {
  const query = useVacationResponse()
  const save = useSaveVacationResponse()
  const [draft, setDraft] = useState<Omit<VacationResponse, "id">>({ isEnabled: false, fromDate: null, toDate: null, subject: null, textBody: null })
  useEffect(() => { if (query.data?.response) setDraft(query.data.response) }, [query.data?.response])
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading vacation settings…</p>
  if (query.isError) return <p role="alert" className="text-sm text-destructive">Could not read vacation settings from Stalwart. Check account permissions.</p>
  if (!query.data?.available) return <ServerFeatureNotice name="Vacation responder" />
  return <form className="space-y-4" onSubmit={event => { event.preventDefault(); void save.mutateAsync(draft) }}>
    <label className="flex items-center gap-3 text-sm font-medium"><Switch checked={draft.isEnabled} onCheckedChange={value => setDraft({ ...draft, isEnabled: value })} /> Enabled</label>
    <label className="block space-y-1 text-sm">Subject<Input value={draft.subject ?? ""} onChange={event => setDraft({ ...draft, subject: event.target.value || null })} /></label>
    <label className="block space-y-1 text-sm">Reply message<Textarea value={draft.textBody ?? ""} onChange={event => setDraft({ ...draft, textBody: event.target.value || null })} /></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="block space-y-1 text-sm">Starts<input type="datetime-local" className="w-full rounded-lg border bg-background p-2" value={draft.fromDate?.slice(0,16) ?? ""} onChange={event => setDraft({ ...draft, fromDate: event.target.value ? new Date(event.target.value).toISOString() : null })} /></label><label className="block space-y-1 text-sm">Ends<input type="datetime-local" className="w-full rounded-lg border bg-background p-2" value={draft.toDate?.slice(0,16) ?? ""} onChange={event => setDraft({ ...draft, toDate: event.target.value ? new Date(event.target.value).toISOString() : null })} /></label></div>
    <Button type="submit" disabled={save.isPending}>Save vacation response</Button>
    {save.isError ? <p role="alert" className="text-sm text-destructive">The server rejected this vacation response.</p> : null}
  </form>
}
export function FiltersSection() {
  const query = useMailFilters(), save = useSaveMailFilters()
  const { data: mailboxes } = useMailboxes()
  const [from, setFrom] = useState(""), [mailbox, setMailbox] = useState("")
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading filters…</p>
  if (query.isError) return <p role="alert" className="text-sm text-destructive">Could not read Sieve filters. Check account permissions.</p>
  if (!query.data?.available) return <ServerFeatureNotice name="Sieve filters" />
  if (query.data.blocked) return <p className="rounded-xl border border-warning bg-warning/10 p-4 text-sm">Another Sieve script is active. The app will leave it untouched. Manage that script in Stalwart before using filters here.</p>
  return <div className="space-y-4"><p className="text-sm text-muted-foreground">Move incoming mail from an exact sender to a folder. Filters run on the server for new messages.</p>
    <form className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={event => { event.preventDefault(); if (!from.includes("@") || !mailbox) return; void save.mutateAsync([...(query.data?.rules ?? []), { id: crypto.randomUUID(), from: from.trim().toLowerCase(), mailbox }]).then(() => { setFrom(""); setMailbox("") }) }}>
      <Input type="email" required aria-label="Sender email" placeholder="Sender email" value={from} onChange={event => setFrom(event.target.value)} />
      <select aria-label="Destination folder" required className="rounded-lg border bg-background p-2 text-sm" value={mailbox} onChange={event => setMailbox(event.target.value)}><option value="">Move to folder…</option>{(mailboxes ?? []).filter(item => !item.role).map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select>
      <Button type="submit" disabled={save.isPending}>Add filter</Button>
    </form>
    {(query.data.rules).map(rule => <div key={rule.id} className="flex items-center gap-2 rounded-lg border p-3 text-sm"><span className="min-w-0 flex-1 break-all">{rule.from} → {rule.mailbox}</span><Button variant="ghost" size="icon-sm" aria-label={`Delete filter for ${rule.from}`} onClick={() => void save.mutateAsync(query.data.rules.filter(item => item.id !== rule.id))}><Trash2 className="size-4" /></Button></div>)}
    {save.isError ? <p role="alert" className="text-sm text-destructive">{save.error instanceof Error ? save.error.message : "Could not save filters."}</p> : null}
  </div>
}
function ServerFeatureNotice({ name }: { name: string }) { return <div className="rounded-xl border p-4"><p className="text-sm font-medium">{name}</p><p className="mt-1 text-sm text-muted-foreground">This server control is available after a supported Stalwart account is connected and its JMAP permissions are verified.</p></div> }
