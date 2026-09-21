/**
 * Contact side sheet: create a contact, mirroring the calendar event editor.
 */

import { useEffect, useState } from "react"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useCreateContact } from "@/queries/contacts"

interface ContactDraft {
  fn: string
  organization: string
  email: string
  phone: string
}

const EMPTY_DRAFT: ContactDraft = {
  fn: "",
  organization: "",
  email: "",
  phone: "",
}

export function ContactEditor({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const create = useCreateContact()
  const [draft, setDraft] = useState<ContactDraft>(EMPTY_DRAFT)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) {
      setDraft(EMPTY_DRAFT)
      setError("")
    }
  }, [open])

  function patch<TKey extends keyof ContactDraft>(
    key: TKey,
    value: ContactDraft[TKey]
  ) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function close() {
    onClose()
  }

  async function save() {
    if (!draft.fn.trim()) return
    setError("")
    try {
      await create.mutateAsync({
        fn: draft.fn.trim(),
        organization: draft.organization.trim() || undefined,
        emails: draft.email.trim()
          ? [
              {
                type: "work" as const,
                value: draft.email.trim(),
                isDefault: true,
              },
            ]
          : undefined,
        phones: draft.phone.trim()
          ? [{ type: "work" as const, value: draft.phone.trim() }]
          : undefined,
      })
      onClose()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not add contact."
      )
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        if (!value) close()
      }}
    >
      <SheetContent
        side="right"
        className="w-full max-w-none sm:max-w-[480px] data-[side=right]:sm:max-w-[480px]"
      >
        <SheetHeader>
          <SheetTitle>Add contact</SheetTitle>
          <SheetDescription>
            Save a contact to reuse when composing mail.
          </SheetDescription>
        </SheetHeader>
        {error ? (
          <p
            role="alert"
            className="mx-6 mb-3 rounded-lg border border-destructive/40 p-3 text-sm"
          >
            {error}
          </p>
        ) : null}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-6">
          <Field label="Name">
            <Input
              autoFocus
              value={draft.fn}
              onChange={(e) => patch("fn", e.target.value)}
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Organization">
            <Input
              value={draft.organization}
              onChange={(e) => patch("organization", e.target.value)}
              placeholder="Acme Inc."
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={draft.email}
              onChange={(e) => patch("email", e.target.value)}
              placeholder="jane@example.com"
            />
          </Field>
          <Field label="Phone">
            <Input
              type="tel"
              value={draft.phone}
              onChange={(e) => patch("phone", e.target.value)}
              placeholder="+91 98765 43210"
            />
          </Field>
        </div>
        <SheetFooter className="flex-row border-t pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <Button type="button" variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={create.isPending || !draft.fn.trim()}
            onClick={() => void save()}
          >
            <UserPlus className="size-4" />
            {create.isPending ? "Adding…" : "Add contact"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <Label className="block space-y-1.5 text-sm">
      <span>{label}</span>
      {children}
    </Label>
  )
}
