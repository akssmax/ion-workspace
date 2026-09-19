/**
 * Shortcuts settings: read-only reference of every keyboard shortcut,
 * grouped by context. Keys render platform-aware (⌘ on macOS).
 */

import { SHORTCUTS } from "@/lib/keyboard"
import type { ShortcutDef } from "@/lib/keyboard"

const CONTEXT_LABELS: Record<ShortcutDef["context"], string> = {
  global: "Global",
  mail: "Mail",
  composer: "Composer",
  calendar: "Calendar",
}

const CONTEXT_ORDER: ShortcutDef["context"][] = [
  "global",
  "mail",
  "composer",
  "calendar",
]

function formatKeys(def: ShortcutDef): string[] {
  const isMac =
    typeof navigator !== "undefined" && /Mac/.test(navigator.platform)
  const keys = isMac && def.macKeys ? def.macKeys : def.keys
  return keys.split("+").map((w) =>
    w === "cmd"
      ? "⌘"
      : w === "ctrl"
        ? "Ctrl"
        : w === "shift"
          ? "⇧"
          : w === "alt"
            ? "⌥"
            : w === "enter"
              ? "⏎"
              : w.length === 1
                ? w.toUpperCase()
                : w
  )
}

export function ShortcutsSection() {
  return (
    <div className="space-y-6">
      {CONTEXT_ORDER.map((context) => {
        const shortcuts = SHORTCUTS.filter((s) => s.context === context)
        if (shortcuts.length === 0) return null
        return (
          <section key={context}>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {CONTEXT_LABELS[context]}
            </h3>
            <div className="divide-y rounded-xl border">
              {shortcuts.map((shortcut) => (
                <div
                  key={shortcut.id}
                  className="flex items-center justify-between gap-4 px-4 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{shortcut.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {shortcut.description}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1">
                    {formatKeys(shortcut).map((key, i) => (
                      <kbd
                        key={i}
                        className="flex h-6 min-w-6 items-center justify-center rounded-md border bg-muted px-1.5 font-sans text-xs font-medium"
                      >
                        {key}
                      </kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
