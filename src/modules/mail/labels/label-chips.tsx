/**
 * Label chips shown on email rows for each applied label.
 */

import { memo } from "react"
import type { EmailProperties, Mailbox } from "@/jmap/types/mail"
import type { UserPreferences } from "@/server/preferences.rpc"
import { resolveTagAppearance } from "@/lib/tag-appearance"
import { LabelChip } from "./label-chip"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

export const LabelChips = memo(function LabelChips({
  email,
  labels,
  tagAppearance,
}: {
  email: EmailProperties
  labels: Mailbox[]
  tagAppearance?: UserPreferences["tagAppearance"]
}) {
  const applied = labels.filter((label) => email.mailboxIds[label.id])
  if (applied.length === 0) return null
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className="flex max-w-28 shrink-0 items-center gap-1"
            tabIndex={0}
            aria-label={applied.map((label) => label.name).join(", ")}
          />
        }
      >
        {applied.slice(0, 1).map((label) => {
          const appearance = resolveTagAppearance(
            tagAppearance?.[label.id],
            label.id
          )
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
        {applied.length > 1 ? (
          <span className="text-[10px] text-muted-foreground">
            +{applied.length - 1}
          </span>
        ) : null}
      </TooltipTrigger>
      <TooltipContent>
        {applied.map((label) => label.name).join(", ")}
      </TooltipContent>
    </Tooltip>
  )
})
