/**
 * "Label as" overflow submenu: toggle labels on the selected threads.
 * A label is checked when every selected email carries it.
 */

import { useState } from "react"
import { Check, Tag } from "lucide-react"
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { useApplyLabel, useMailboxes, useThreadEmails } from "@/queries/mail"
import { usePreferences } from "@/queries/preferences"
import { cn } from "cn"
import { accentClasses } from "@/lib/accents"
import { resolveTagAppearance } from "@/lib/tag-appearance"
import { labelsOf } from "./labels"

export function LabelMenu({
  threadIds,
  disabled,
}: {
  threadIds: string[]
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const { data: mailboxes } = useMailboxes()
  const { data: prefs } = usePreferences()
  const labels = labelsOf(mailboxes ?? [])
  const emails = useThreadEmails(threadIds, open)
  const applyLabel = useApplyLabel()

  const total = emails.data?.length ?? 0
  const appliedCount = (labelId: string) =>
    emails.data?.filter((e) => e.mailboxIds[labelId]).length ?? 0

  function toggle(labelId: string) {
    // Apply to all unless every email already carries the label.
    const applied = total === 0 || appliedCount(labelId) < total
    void applyLabel.mutateAsync({ ids: threadIds, labelId, applied })
  }

  return (
    <DropdownMenuSub
      open={open}
      onOpenChange={setOpen}
      disabled={disabled || threadIds.length === 0}
    >
      <DropdownMenuSubTrigger>
        <Tag className="size-4" />
        Label as
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {labels.length === 0 ? (
          <DropdownMenuItem disabled>
            No labels yet — create a folder first
          </DropdownMenuItem>
        ) : (
          labels.map((label) => {
            const checked = total > 0 && appliedCount(label.id) === total
            const appearance = resolveTagAppearance(
              prefs?.tagAppearance?.[label.id],
              label.id
            )
            return (
              <DropdownMenuItem
                key={label.id}
                onClick={() => toggle(label.id)}
              >
                <span className="flex size-4 items-center justify-center">
                  {checked ? <Check className="size-3.5" /> : null}
                </span>
                <appearance.Icon
                  className={cn(
                    "size-4 shrink-0",
                    accentClasses(appearance.color).icon
                  )}
                />
                {label.name}
              </DropdownMenuItem>
            )
          })
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
