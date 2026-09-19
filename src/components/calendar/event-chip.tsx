/**
 * Calendar event chip: 200-shade accent fill, optional hex fallback for JMAP colors.
 */

import { cn } from "cn"
import {
  accentClasses,
  accentForKey,
  isHexColor,
  parseAccent,
  type AccentName,
} from "@/lib/accents"

export function CalendarEventChip({
  title,
  color,
  fallbackKey,
  accent,
  selected = false,
  className,
  onClick,
}: {
  title: string
  color?: string | null
  fallbackKey?: string
  accent?: AccentName
  selected?: boolean
  className?: string
  onClick?: (e: React.MouseEvent) => void
}) {
  const parsed = parseAccent(color ?? undefined)
  const hex = !accent && !parsed && color && isHexColor(color) ? color : null
  const named =
    accent ??
    parsed ??
    (hex ? null : fallbackKey ? accentForKey(fallbackKey) : null)
  const tone = named ? accentClasses(named) : null

  return (
    <div
      onClick={onClick}
      className={cn(
        "truncate rounded px-1.5 py-0.5 text-[11px] font-medium",
        onClick && "cursor-pointer",
        selected && "ring-2 ring-ring",
        tone && [tone.bg, tone.text],
        !tone && !hex && "bg-primary/15 text-primary",
        className
      )}
      style={hex ? { backgroundColor: hex, color: "#fff" } : undefined}
    >
      {title || "(no title)"}
    </div>
  )
}
