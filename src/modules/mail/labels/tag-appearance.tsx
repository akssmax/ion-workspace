/**
 * Custom tag appearance controls: a color + icon picker backed by user
 * preferences. Rendered inline in settings and inside a dialog from the
 * mailbox context menu.
 */

import { Palette, RotateCcw } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ACCENT_NAMES, accentClasses } from "@/lib/accents"
import {
  TAG_ICON_NAMES,
  TAG_ICONS,
  isTagIconName,
  resolveTagAppearance,
} from "@/lib/tag-appearance"
import type { TagAppearance } from "@/lib/tag-appearance"
import { usePreferences, useSavePreferences } from "@/queries/preferences"

/**
 * Read + write the stored appearance for one mailbox. Falls back to a
 * stable accent derived from the mailbox id when nothing is stored.
 */
export function useTagAppearance(id: string) {
  const { data: prefs } = usePreferences()
  const save = useSavePreferences()
  const stored = prefs?.tagAppearance?.[id]
  const resolved = resolveTagAppearance(stored, id)

  function set(next: TagAppearance | null) {
    const all = { ...prefs?.tagAppearance }
    if (next === null) delete all[id]
    else all[id] = { ...stored, ...next }
    void save.mutateAsync({ tagAppearance: all })
  }

  return { ...resolved, stored, set }
}

/** Color + icon picker. Presentational — pass the current value and a setter. */
export function TagAppearancePicker({
  name,
  color,
  icon,
  onChange,
  onReset,
  className,
}: {
  name: string
  color: string
  icon: string
  onChange: (next: TagAppearance) => void
  onReset?: () => void
  className?: string
}) {
  const tone = accentClasses(resolveTagAppearance({ color }, name).color)
  const Preview = isTagIconName(icon) ? TAG_ICONS[icon] : TAG_ICONS.tag
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            tone.bg,
            tone.text
          )}
        >
          <Preview className="size-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {name}
        </span>
        {onReset ? (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Color</p>
        <div className="flex flex-wrap gap-1.5">
          {ACCENT_NAMES.map((accent) => (
            <button
              key={accent}
              type="button"
              aria-label={accent}
              aria-pressed={accent === color}
              onClick={() => onChange({ color: accent })}
              className={cn(
                "size-6 rounded-full ring-offset-2 ring-offset-popover transition",
                accentClasses(accent).dot,
                accent === color
                  ? "ring-2 ring-ring"
                  : "hover:ring-2 hover:ring-ring/40"
              )}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Icon</p>
        <div className="grid max-h-44 grid-cols-8 gap-1 overflow-y-auto pe-1">
          {TAG_ICON_NAMES.map((key) => {
            const OptionIcon = TAG_ICONS[key]
            const selected = key === icon
            return (
              <button
                key={key}
                type="button"
                aria-label={key}
                aria-pressed={selected}
                onClick={() => onChange({ icon: key })}
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-accent-foreground",
                  selected && "bg-accent text-accent-foreground"
                )}
              >
                <OptionIcon className="size-4" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** Dialog opened from the sidebar mailbox menu. */
export function TagAppearanceDialog({
  id,
  name,
  open,
  onOpenChange,
}: {
  id: string
  name: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { color, icon, set, stored } = useTagAppearance(id)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Customize “{name}”</DialogTitle>
          <DialogDescription>
            Pick a color and icon. Shown across the sidebar, message list, and
            label menu.
          </DialogDescription>
        </DialogHeader>
        <TagAppearancePicker
          name={name}
          color={color}
          icon={icon}
          onChange={set}
          onReset={stored ? () => set(null) : undefined}
        />
      </DialogContent>
    </Dialog>
  )
}

/** Compact popover control for settings rows. */
export function TagAppearanceControl({
  id,
  name,
}: {
  id: string
  name: string
}) {
  const { color, icon, set, stored, Icon } = useTagAppearance(id)
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label={`Appearance for ${name}`}
          />
        }
      >
        <Icon className={cn("size-4", accentClasses(color).icon)} />
        Appearance
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <PopoverHeader>
          <PopoverTitle>Tag appearance</PopoverTitle>
          <PopoverDescription>
            Choose from the design system palette and icons.
          </PopoverDescription>
        </PopoverHeader>
        <TagAppearancePicker
          name={name}
          color={color}
          icon={icon}
          onChange={set}
          onReset={stored ? () => set(null) : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}

/** Draft picker used before a tag exists (create flows). */
export function TagAppearanceDraftControl({
  name,
  color,
  icon,
  onChange,
  onOpenChange,
}: {
  name: string
  color?: string
  icon?: string
  onChange: (next: TagAppearance) => void
  onOpenChange?: (open: boolean) => void
}) {
  const tone = accentClasses(resolveTagAppearance({ color }, name || "new").color)
  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Choose tag appearance"
          />
        }
      >
        <Palette className={cn("size-4", tone.icon)} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <PopoverHeader>
          <PopoverTitle>Tag appearance</PopoverTitle>
          <PopoverDescription>
            Choose from the design system palette and icons.
          </PopoverDescription>
        </PopoverHeader>
        <TagAppearancePicker
          name={name || "New tag"}
          color={color ?? ""}
          icon={icon ?? "tag"}
          onChange={onChange}
        />
      </PopoverContent>
    </Popover>
  )
}

/** Current appearance rendered as a small icon tile (list summaries). */
export function TagAppearanceBadge({
  color,
  icon,
  className,
}: {
  color: string
  icon: string
  className?: string
}) {
  const tone = accentClasses(resolveTagAppearance({ color, icon }, "").color)
  const Icon = isTagIconName(icon) ? TAG_ICONS[icon] : TAG_ICONS.tag
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg",
        tone.bg,
        tone.text,
        className
      )}
    >
      <Icon className="size-4" />
    </span>
  )
}
