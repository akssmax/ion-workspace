/**
 * MD3 floating action button for phones. Anchored above the bottom navigation
 * bar, respecting the safe-area inset and RTL. Shown on small screens only —
 * desktop keeps its header actions.
 */

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

/** 56dp container, 16dp radius, level-3 elevation, above the bottom bar. */
const FAB_CLASS =
  "fixed end-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom)+1rem)] z-40 h-14 gap-2 rounded-2xl px-5 shadow-lg md:hidden"

export function MobileFab({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={FAB_CLASS}
    >
      <Icon className="size-5" />
      {label}
    </Button>
  )
}

export interface MobileFabAction {
  key: string
  label: string
  icon: LucideIcon
  onSelect: () => void
}

/**
 * A FAB that reveals its actions in a bottom sheet, for destinations with more
 * than one creation action (e.g. upload a file or create a folder).
 */
export function MobileFabMenu({
  icon: Icon,
  label,
  actions,
}: {
  icon: LucideIcon
  label: string
  actions: MobileFabAction[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button aria-label={label} className={FAB_CLASS} />}
      >
        <Icon className="size-5" />
        {label}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader>
          <SheetTitle>{label}</SheetTitle>
        </SheetHeader>
        <div className="space-y-1 px-3 pb-4">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => {
                setOpen(false)
                action.onSelect()
              }}
              className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-start text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
            >
              <action.icon className="size-5 text-muted-foreground" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
