/**
 * Presentational label chip. Color comes from the shared 200-shade accent palette.
 */

import { cn } from "cn"
import {
  accentClasses,
  accentForKey,
  type AccentName,
} from "@/lib/accents"

export function LabelChip({
  name,
  accent,
  className,
}: {
  name: string
  accent?: AccentName
  className?: string
}) {
  const tone = accentClasses(accent ?? accentForKey(name))
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-medium",
        tone.bg,
        tone.text,
        className
      )}
    >
      {name}
    </span>
  )
}
