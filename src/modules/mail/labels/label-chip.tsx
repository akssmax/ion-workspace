/**
 * Presentational label chip. Color comes from the shared 200-shade accent
 * palette; an optional design-system icon is shown before the name.
 */

import { cn } from "cn"
import { accentClasses, accentForKey } from "@/lib/accents"
import type { AccentName } from "@/lib/accents"
import { TAG_ICONS } from "@/lib/tag-appearance"
import type { TagIconName } from "@/lib/tag-appearance"

export function LabelChip({
  name,
  accent,
  icon,
  className,
}: {
  name: string
  accent?: AccentName
  icon?: TagIconName
  className?: string
}) {
  const tone = accentClasses(accent ?? accentForKey(name))
  const Icon = icon ? TAG_ICONS[icon] : null
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-medium",
        tone.bg,
        tone.text,
        className
      )}
    >
      {Icon ? <Icon className="size-2.5 shrink-0" /> : null}
      <span className="truncate">{name}</span>
    </span>
  )
}
