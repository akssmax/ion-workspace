/**
 * Contacts: address-book list + detail panel + create/edit/delete.
 */

import { useState } from "react"
import {
  UserPlus,
  Trash2,
  Phone,
  Mail,
  Building2,
  StickyNote,
  Save,
  ArrowLeft,
} from "lucide-react"
import { cn } from "cn"
import {
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDestroyContact,
} from "@/queries/contacts"
import { useSession } from "@/hooks/use-session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import type { Contact } from "@/jmap/types/contacts"
import { OpenSidebarTrigger } from "@/components/shell/open-sidebar-trigger"
import { useIsMobile } from "@/hooks/use-mobile"

export function ContactsView() {
  const isMobile = useIsMobile()
  const { data: contacts, isLoading } = useContacts()
  const session = useSession()
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const destroyContact = useDestroyContact()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(false)

  const selected = contacts?.find((c) => c.id === selectedId) ?? null

  async function handleCreate(fields: {
    fn: string
    email: string
    phone: string
    organization: string
  }) {
    if (!fields.fn.trim()) return
    await createContact.mutateAsync({
      fn: fields.fn.trim(),
      organization: fields.organization.trim() || undefined,
      emails: fields.email.trim()
        ? [
            {
              type: "work" as const,
              value: fields.email.trim(),
              isDefault: true,
            },
          ]
        : undefined,
      phones: fields.phone.trim()
        ? [{ type: "work" as const, value: fields.phone.trim() }]
        : undefined,
    })
    setAdding(false)
  }

  async function handleUpdate(patch: Partial<Contact>) {
    if (!selected) return
    await updateContact.mutateAsync({ id: selected.id, patch })
    setEditing(false)
  }

  return (
    <div className="flex h-full min-w-0">
      <div className={cn("flex min-w-0 flex-1 flex-col", isMobile && selected && "hidden")}>
        <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 sm:px-4">
          <OpenSidebarTrigger />
          <h1 className="text-sm font-semibold">Contacts</h1>
          <span className="text-xs text-muted-foreground">
            {contacts?.length ?? 0} contact{contacts?.length === 1 ? "" : "s"}
          </span>
          {!adding && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => setAdding(true)}
            >
              <UserPlus className="size-4" />
              Add contact
            </Button>
          )}
        </header>

        {adding ? (
          <CreateContactForm
            onCancel={() => setAdding(false)}
            onCreate={(f) => void handleCreate(f)}
          />
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : contacts && contacts.length > 0 ? (
            contacts.map((c) => {
              const primary =
                c.emails?.find((e) => e.isDefault) ?? c.emails?.[0]
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedId(c.id)
                    setEditing(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 border-b px-4 py-2.5 text-left transition-colors hover:bg-muted/50",
                    selectedId === c.id && "bg-accent"
                  )}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initials(c.fn ?? "?")}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {c.fn || "(no name)"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {primary?.value ?? c.organization ?? "—"}
                    </p>
                  </div>
                </button>
              )
            })
          ) : (
            <EmptyState
              icon={<UserPlus />}
              title="No contacts yet"
              description={
                session.data?.email
                  ? `Using account ${session.data.email}.`
                  : "Add your first contact to get started."
              }
              action={<Button size="sm">New contact</Button>}
              className="h-full rounded-none border-0"
            />
          )}
        </div>
      </div>

      {selected ? (
        <aside className="min-w-0 w-full shrink-0 overflow-y-auto border-l bg-card md:w-96">
          {isMobile ? (
            <Button variant="ghost" size="sm" className="m-3" onClick={() => { setSelectedId(null); setEditing(false) }}>
              <ArrowLeft className="size-4" /> Back to contacts
            </Button>
          ) : null}
          {editing ? (
            <EditContactForm
              contact={selected}
              onCancel={() => setEditing(false)}
              onSave={(patch) => void handleUpdate(patch)}
            />
          ) : (
            <ContactDetail
              contact={selected}
              onEdit={() => setEditing(true)}
              onDelete={() => {
                void destroyContact.mutateAsync(selected.id)
                setSelectedId(null)
              }}
            />
          )}
        </aside>
      ) : null}
    </div>
  )
}

function CreateContactForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void
  onCreate: (fields: {
    fn: string
    email: string
    phone: string
    organization: string
  }) => void
}) {
  const [fn, setFn] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [organization, setOrganization] = useState("")

  return (
    <form
      className="grid grid-cols-1 gap-3 border-b p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        onCreate({ fn, email, phone, organization })
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="cfn">Name</Label>
        <Input
          id="cfn"
          value={fn}
          onChange={(e) => setFn(e.target.value)}
          placeholder="Jane Doe"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="corg">Organization</Label>
        <Input
          id="corg"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cemail">Email</Label>
        <Input
          id="cemail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cphone">Phone</Label>
        <Input
          id="cphone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="submit" disabled={!fn.trim()}>
          <UserPlus className="size-4" />
          Add contact
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function ContactDetail({
  contact,
  onEdit,
  onDelete,
}: {
  contact: Contact
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initials(contact.fn ?? "?")}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">
            {contact.fn || "(no name)"}
          </h2>
          {contact.organization ? (
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Building2 className="size-3.5" />
              {contact.organization}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {contact.emails?.length ? (
          <div className="space-y-1">
            {contact.emails.map((em, i) => (
              <p key={i} className="flex items-center gap-2 text-sm">
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                <a
                  href={`mailto:${em.value}`}
                  className="truncate text-primary underline-offset-2 hover:underline"
                >
                  {em.value}
                </a>
              </p>
            ))}
          </div>
        ) : null}
        {contact.phones?.length ? (
          <div className="space-y-1">
            {contact.phones.map((ph, i) => (
              <p key={i} className="flex items-center gap-2 text-sm">
                <Phone className="size-4 shrink-0 text-muted-foreground" />
                {ph.value}
              </p>
            ))}
          </div>
        ) : null}
        {contact.notes ? (
          <p className="flex items-start gap-2 text-sm">
            <StickyNote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="whitespace-pre-wrap">{contact.notes}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="ml-auto"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  )
}

function EditContactForm({
  contact,
  onCancel,
  onSave,
}: {
  contact: Contact
  onCancel: () => void
  onSave: (patch: Partial<Contact>) => void
}) {
  const [fn, setFn] = useState(contact.fn ?? "")
  const [organization, setOrganization] = useState(contact.organization ?? "")
  const primary =
    contact.emails?.find((e) => e.isDefault) ?? contact.emails?.[0]
  const [email, setEmail] = useState(primary?.value ?? "")
  const phone = contact.phones?.[0]
  const [phoneVal, setPhoneVal] = useState(phone?.value ?? "")
  const [notes, setNotes] = useState(contact.notes ?? "")

  return (
    <form
      className="space-y-3 p-5"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({
          fn: fn.trim() || null,
          organization: organization.trim() || null,
          emails: email.trim()
            ? [{ type: "work" as const, value: email.trim(), isDefault: true }]
            : [],
          phones: phoneVal.trim()
            ? [{ type: "work" as const, value: phoneVal.trim() }]
            : [],
          notes: notes.trim() || null,
        })
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="efn">Name</Label>
        <Input id="efn" value={fn} onChange={(e) => setFn(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="eorg">Organization</Label>
        <Input
          id="eorg"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="eemail">Email</Label>
        <Input
          id="eemail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ephone">Phone</Label>
        <Input
          id="ephone"
          value={phoneVal}
          onChange={(e) => setPhoneVal(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="enotes">Notes</Label>
        <Input
          id="enotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Button type="submit">
          <Save className="size-4" />
          Save
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
