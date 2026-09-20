/**
 * Label chips shown on email rows for each applied label.
 */

import type { EmailProperties } from "@/jmap/types/mail"
import { resolveTagAppearance } from "@/lib/tag-appearance"
import { useMailboxes } from "@/queries/mail"
import { usePreferences } from "@/queries/preferences"
import { LabelChip } from "./label-chip"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { emailLabels } from "./labels"

export function LabelChips({ email }: { email: EmailProperties }) {
  const { data: mailboxes } = useMailboxes()
  const { data: prefs } = usePreferences()
  const labels = emailLabels(email, mailboxes ?? [])
  if (labels.length === 0) return null
  return (
    <Tooltip><TooltipTrigger render={<span className="flex max-w-28 shrink-0 items-center gap-1" tabIndex={0} aria-label={labels.map((label) => label.name).join(", ")} />}>
      {labels.slice(0, 1).map((label) => {
        const appearance = resolveTagAppearance(prefs?.tagAppearance?.[label.id], label.id)
        return (
        <LabelChip
          key={label.id}
          name={label.name}
          accent={appearance.color}
          icon={appearance.icon}
          className="max-w-20"
        />
        )
      })}
      {labels.length > 1 ? <span className="text-[10px] text-muted-foreground">+{labels.length - 1}</span> : null}
    </TooltipTrigger><TooltipContent>{labels.map(label => label.name).join(", ")}</TooltipContent></Tooltip>
  )
}
