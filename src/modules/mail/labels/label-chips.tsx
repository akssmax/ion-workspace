/**
 * Label chips shown on email rows for each applied label.
 */

import type { EmailProperties } from "@/jmap/types/mail"
import { accentForKey } from "@/lib/accents"
import { useMailboxes } from "@/queries/mail"
import { LabelChip } from "./label-chip"
import { emailLabels } from "./labels"

export function LabelChips({ email }: { email: EmailProperties }) {
  const { data: mailboxes } = useMailboxes()
  const labels = emailLabels(email, mailboxes ?? [])
  if (labels.length === 0) return null
  return (
    <span className="flex shrink-0 items-center gap-1">
      {labels.map((label) => (
        <LabelChip
          key={label.id}
          name={label.name}
          accent={accentForKey(label.id)}
        />
      ))}
    </span>
  )
}
