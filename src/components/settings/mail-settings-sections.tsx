import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { usePreferences, useSavePreferences } from "@/queries/preferences"
import { useCreateMailbox, useDeleteMailbox, useIdentities, useMailboxes, useRenameMailbox, useUpdateIdentity } from "@/queries/mail"
import { useDeleteMailTemplate, useMailTemplates, useSaveMailTemplate } from "@/queries/mail-templates"
import { filenameDefaults, formatMailFilename, type FilenameKind } from "@/lib/mail-filenames"
import { SaveState } from "./settings-page"
import { useSaveVacationResponse, useVacationResponse, type VacationResponse } from "@/queries/mail-vacation"
import { useMailFilters, useSaveMailFilters } from "@/queries/mail-filters"
import { getMailConnectionStatus } from "@/server/mail-connection.rpc"
import { useSession } from "@/hooks/use-session"
import { format, parseISO } from "date-fns"

function SettingsSelect({ id, value, options, onChange, className = "w-full", ariaLabel }: { id: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; className?: string; ariaLabel?: string }) {
  return <Select value={value} onValueChange={next => { if (typeof next === "string") onChange(next) }}>
    <SelectTrigger id={id} aria-label={ariaLabel} className={className}><SelectValue>{options.find(option => option.value === value)?.label ?? options[0]?.label}</SelectValue></SelectTrigger>
    <SelectContent>{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
  </Select>
}

const hours = Array.from({ length: 24 }, (_, hour) => ({ value: String(hour).padStart(2, "0"), label: String(hour).padStart(2, "0") }))
const minutes = Array.from({ length: 60 }, (_, minute) => ({ value: String(minute).padStart(2, "0"), label: String(minute).padStart(2, "0") }))

function VacationDateTime({ id, label, value, onChange }: { id: string; label: string; value: string | null; onChange: (value: string | null) => void }) {
  const date = value ? parseISO(value) : null
  const setPart = (day: string, hour: string, minute: string) => onChange(day ? new Date(`${day}T${hour}:${minute}:00`).toISOString() : null)
  const day = date ? format(date, "yyyy-MM-dd") : ""
  const hour = date ? format(date, "HH") : "09"
  const minute = date ? format(date, "mm") : "00"
  return <div className="space-y-1 text-sm"><label htmlFor={id}>{label}</label><div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2"><DatePicker id={id} value={day} onChange={next => setPart(next, hour, minute)} /><SettingsSelect id={`${id}-hour`} ariaLabel={`${label} hour`} value={hour} options={hours} onChange={next => setPart(day, next, minute)} className="w-17" /><SettingsSelect id={`${id}-minute`} ariaLabel={`${label} minute`} value={minute} options={minutes} onChange={next => setPart(day, hour, next)} className="w-17" /></div></div>
}

function useMailPermissions() {
  const { data: session } = useSession()
  return useQuery({ queryKey: ["mail-connection", session?.userId], queryFn: getMailConnectionStatus, enabled: !!session, retry: false })
}

export function ComposingSection() {
  const { data: prefs } = usePreferences()
  const save = useSavePreferences()
  const identities = useIdentities()
  return <div className="space-y-5">
    <label className="block space-y-1 text-sm font-medium">Default sending identity
      <SettingsSelect id="default-identity" value={prefs?.defaultIdentityId ?? "default"} options={[{ value: "default", label: "First available identity" }, ...(identities.data ?? []).map(identity => ({ value: identity.id, label: `${identity.name} <${identity.email}>` }))]} onChange={value => void save.mutateAsync({ defaultIdentityId: value === "default" ? "" : value })} />
    </label>
    <label className="block space-y-1 text-sm font-medium">Reply default
      <SettingsSelect id="reply-default" value={prefs?.replyDefault ?? "reply"} options={[{ value: "reply", label: "Reply to sender" }, { value: "reply-all", label: "Reply to everyone" }]} onChange={value => void save.mutateAsync({ replyDefault: value as "reply" | "reply-all" })} />
    </label>
    <label className="block space-y-1 text-sm font-medium">Signature placement
      <SettingsSelect id="signature-placement" value={prefs?.signaturePlacement ?? "above"} options={[{ value: "above", label: "Above quoted text" }, { value: "below", label: "Below quoted text" }]} onChange={value => void save.mutateAsync({ signaturePlacement: value as "above" | "below" })} />
    </label>
    <label className="block space-y-1 text-sm font-medium">Default signature
      <Textarea value={prefs?.signatureText ?? ""} onChange={event => void save.mutateAsync({ signatureText: event.target.value })} placeholder="Your signature" />
    </label>
    {(identities.data ?? []).map(identity => <label key={identity.id} className="block space-y-1 text-sm font-medium">Signature for {identity.email}
      <Textarea value={prefs?.signatures?.[identity.id]?.text ?? ""} onChange={event => void save.mutateAsync({ signatures: { ...prefs?.signatures, [identity.id]: { ...prefs?.signatures?.[identity.id], text: event.target.value } } })} placeholder="Uses default signature when empty" />
    </label>)}
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
      <SettingsSelect id="filename-spaces" value={prefs?.filenameSpaces ?? "keep"} options={[{ value: "keep", label: "Keep spaces" }, { value: "dash", label: "Use dashes" }, { value: "underscore", label: "Use underscores" }]} onChange={value => void save.mutateAsync({ filenameSpaces: value as "keep" | "dash" | "underscore" })} className="min-w-40" />
    </label>
    <SaveState isSaving={save.isPending} isError={save.isError} />
  </div>
}

export function ContentSection() {
  const { data: prefs } = usePreferences()
  const save = useSavePreferences()
  return <div className="space-y-5">
    <label className="block space-y-1 text-sm font-medium">Remote images
      <SettingsSelect id="remote-images" value={prefs?.remoteImages ?? "never"} options={[{ value: "never", label: "Ask before loading" }, { value: "trusted", label: "Load for trusted senders" }, { value: "always", label: "Always load" }]} onChange={value => void save.mutateAsync({ remoteImages: value as "never" | "trusted" | "always" })} />
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
  const connection = useMailPermissions()
  const canEdit = connection.data?.mode === "mock" || connection.data?.permissions.includes("jmap-identity-set")
  return <div className="space-y-3">{identities.isLoading ? <p>Loading identities…</p> : identities.isError ? <p className="text-destructive">Could not load identities from the mail server.</p> : (identities.data ?? []).map(identity => <div key={identity.id} className="rounded-xl border p-3"><p className="font-medium">{identity.name || identity.email}</p><p className="text-sm text-muted-foreground">{identity.email}</p>{canEdit ? <Button variant="outline" size="sm" className="mt-2" onClick={() => { const name = window.prompt("Display name", identity.name); if (name?.trim() && name !== identity.name) void update.mutateAsync({ id: identity.id, name: name.trim() }) }}>Edit display name</Button> : null}</div>)}{!canEdit ? <p className="text-xs text-muted-foreground">Identity editing is not permitted for this Stalwart account.</p> : null}{update.isError ? <p role="alert" className="text-sm text-destructive">The server rejected the identity change.</p> : null}<p className="text-xs text-muted-foreground">These addresses come from your mail server. Choose the default in Composing.</p></div>
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const clear = () => { setEditingId(null); setName(""); setSubject(""); setBody("") }
  if (!available) return <p className="text-sm text-muted-foreground">Templates require the app metadata database. Configure DATABASE_URL and run the mail migrations.</p>
  return <div className="space-y-4"><form className="space-y-2" onSubmit={event => { event.preventDefault(); if (name.trim()) void save.mutateAsync({ id: editingId ?? undefined, name: name.trim(), subject, htmlBody: body }).then(clear) }}><Input aria-label="Template name" placeholder="Template name" value={name} onChange={event => setName(event.target.value)} /><Input aria-label="Template subject" placeholder="Subject" value={subject} onChange={event => setSubject(event.target.value)} /><Textarea aria-label="Template body" placeholder="Message body" value={body} onChange={event => setBody(event.target.value)} /><div className="flex gap-2"><Button type="submit" disabled={!name.trim() || save.isPending}>{editingId ? "Update template" : "Save template"}</Button>{editingId ? <Button type="button" variant="outline" onClick={clear}>Cancel</Button> : null}</div>{save.isError ? <p role="alert" className="text-sm text-destructive">Could not save this template.</p> : null}</form>{templates.map(template => <div key={template.id} className="flex items-center gap-2 rounded-lg border p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{template.name}</p><p className="truncate text-xs text-muted-foreground">{template.subject}</p></div><Button variant="ghost" size="sm" onClick={() => { setEditingId(template.id); setName(template.name); setSubject(template.subject); setBody(template.htmlBody) }}>Edit</Button><Button variant="ghost" size="icon-sm" aria-label={`Delete ${template.name}`} onClick={() => void remove.mutateAsync(template.id)}><Trash2 className="size-4" /></Button></div>)}</div>
}

export function VacationSection() {
  const query = useVacationResponse()
  const save = useSaveVacationResponse()
  const connection = useMailPermissions()
  const [draft, setDraft] = useState<Omit<VacationResponse, "id">>({ isEnabled: false, fromDate: null, toDate: null, subject: null, textBody: null })
  useEffect(() => { if (query.data?.response) setDraft(query.data.response) }, [query.data?.response])
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading vacation settings…</p>
  if (query.isError) return <p role="alert" className="text-sm text-destructive">Could not read vacation settings from Stalwart. Check account permissions.</p>
  if (!query.data?.available) return <ServerFeatureNotice name="Vacation responder" />
  if (connection.data?.mode === "real" && !connection.data.permissions.includes("jmap-vacation-response-set")) return <ServerFeatureNotice name="Vacation responder editing" />
  return <form className="space-y-4" onSubmit={event => { event.preventDefault(); void save.mutateAsync(draft) }}>
    <label className="flex items-center gap-3 text-sm font-medium"><Switch checked={draft.isEnabled} onCheckedChange={value => setDraft({ ...draft, isEnabled: value })} /> Enabled</label>
    <label className="block space-y-1 text-sm">Subject<Input value={draft.subject ?? ""} onChange={event => setDraft({ ...draft, subject: event.target.value || null })} /></label>
    <label className="block space-y-1 text-sm">Reply message<Textarea value={draft.textBody ?? ""} onChange={event => setDraft({ ...draft, textBody: event.target.value || null })} /></label>
    <div className="grid gap-3 sm:grid-cols-2"><VacationDateTime id="vacation-start" label="Starts" value={draft.fromDate} onChange={fromDate => setDraft({ ...draft, fromDate })} /><VacationDateTime id="vacation-end" label="Ends" value={draft.toDate} onChange={toDate => setDraft({ ...draft, toDate })} /></div>
    <Button type="submit" disabled={save.isPending}>Save vacation response</Button>
    {save.isError ? <p role="alert" className="text-sm text-destructive">The server rejected this vacation response.</p> : null}
  </form>
}
export function FiltersSection() {
  const query = useMailFilters(), save = useSaveMailFilters()
  const connection = useMailPermissions()
  const { data: mailboxes } = useMailboxes()
  const [from, setFrom] = useState(""), [mailbox, setMailbox] = useState("")
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading filters…</p>
  if (query.isError) return <p role="alert" className="text-sm text-destructive">Could not read Sieve filters. Check account permissions.</p>
  if (!query.data?.available) return <ServerFeatureNotice name="Sieve filters" />
  if (connection.data?.mode === "real" && !connection.data.permissions.includes("jmap-sieve-script-set")) return <ServerFeatureNotice name="Sieve filter editing" />
  if (query.data.blocked) return <p className="rounded-xl border border-warning bg-warning/10 p-4 text-sm">Another Sieve script is active. The app will leave it untouched. Manage that script in Stalwart before using filters here.</p>
  return <div className="space-y-4"><p className="text-sm text-muted-foreground">Move incoming mail from an exact sender to a folder. Filters run on the server for new messages.</p>
    <form className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={event => { event.preventDefault(); if (!from.includes("@") || !mailbox) return; void save.mutateAsync([...(query.data?.rules ?? []), { id: crypto.randomUUID(), from: from.trim().toLowerCase(), mailbox }]).then(() => { setFrom(""); setMailbox("") }) }}>
      <Input type="email" required aria-label="Sender email" placeholder="Sender email" value={from} onChange={event => setFrom(event.target.value)} />
      <SettingsSelect id="filter-destination" value={mailbox || "none"} options={[{ value: "none", label: "Move to folder…" }, ...(mailboxes ?? []).filter(item => !item.role).map(item => ({ value: item.name, label: item.name }))]} onChange={value => setMailbox(value === "none" ? "" : value)} />
      <Button type="submit" disabled={save.isPending}>Add filter</Button>
    </form>
    {(query.data.rules).map(rule => <div key={rule.id} className="flex items-center gap-2 rounded-lg border p-3 text-sm"><span className="min-w-0 flex-1 break-all">{rule.from} → {rule.mailbox}</span><Button variant="ghost" size="icon-sm" aria-label={`Delete filter for ${rule.from}`} onClick={() => void save.mutateAsync(query.data.rules.filter(item => item.id !== rule.id))}><Trash2 className="size-4" /></Button></div>)}
    {save.isError ? <p role="alert" className="text-sm text-destructive">{save.error instanceof Error ? save.error.message : "Could not save filters."}</p> : null}
  </div>
}
function ServerFeatureNotice({ name }: { name: string }) { return <div className="rounded-xl border p-4"><p className="text-sm font-medium">{name}</p><p className="mt-1 text-sm text-muted-foreground">This server control is available after a supported Stalwart account is connected and its JMAP permissions are verified.</p></div> }
