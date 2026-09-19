/**
 * Keyboard shortcuts for the workspace shell.
 * Follows Gmail/Google-workspace conventions where applicable.
 */

export interface ShortcutDef {
  id: string
  label: string
  keys: string
  macKeys?: string
  context: "global" | "mail" | "composer" | "calendar"
  description: string
}

/**
 * Normalized shortcut keys. Format examples:
 *   "c"        → compose
 *   "shift+i"  → mark read
 *   "cmd+k"    → command palette (mac)
 *   "ctrl+k"   → command palette (win/linux)
 */
export const SHORTCUTS: ShortcutDef[] = [
  {
    id: "compose",
    label: "Compose",
    keys: "c",
    context: "mail",
    description: "Start a new message",
  },
  {
    id: "search",
    label: "Search",
    keys: "/",
    context: "mail",
    description: "Focus the search box",
  },
  {
    id: "palette",
    label: "Command palette",
    keys: "cmd+k",
    macKeys: "cmd+k",
    context: "global",
    description: "Open the command palette",
  },
  {
    id: "refresh",
    label: "Refresh",
    keys: "ctrl+r",
    macKeys: "cmd+r",
    context: "mail",
    description: "Refresh the current mailbox",
  },
  {
    id: "mark-read",
    label: "Mark as read",
    keys: "shift+i",
    context: "mail",
    description: "Mark the selected message as read",
  },
  {
    id: "mark-unread",
    label: "Mark as unread",
    keys: "shift+u",
    context: "mail",
    description: "Mark the selected message as unread",
  },
  {
    id: "archive",
    label: "Archive",
    keys: "e",
    context: "mail",
    description: "Archive the selected message",
  },
  {
    id: "move-trash",
    label: "Delete",
    keys: "#",
    context: "mail",
    description: "Move the selected message to trash",
  },
  {
    id: "open-thread",
    label: "Open",
    keys: "o",
    context: "mail",
    description: "Open the selected thread",
  },
  {
    id: "star",
    label: "Star",
    keys: "s",
    context: "mail",
    description: "Star the selected message",
  },
  {
    id: "reply",
    label: "Reply",
    keys: "r",
    context: "mail",
    description: "Reply to the selected message",
  },
  {
    id: "reply-all",
    label: "Reply all",
    keys: "shift+r",
    context: "mail",
    description: "Reply to all recipients",
  },
  {
    id: "forward",
    label: "Forward",
    keys: "f",
    context: "mail",
    description: "Forward the selected message",
  },
  {
    id: "send",
    label: "Send",
    keys: "cmd+enter",
    macKeys: "cmd+enter",
    context: "composer",
    description: "Send the current message",
  },
  {
    id: "today",
    label: "Today",
    keys: "t",
    context: "calendar",
    description: "Jump to today",
  },
  {
    id: "prev-day",
    label: "Previous",
    keys: "j",
    context: "calendar",
    description: "Previous day",
  },
  {
    id: "next-day",
    label: "Next",
    keys: "k",
    context: "calendar",
    description: "Next day",
  },
]

export function lookupShortcut(id: string): ShortcutDef | undefined {
  return SHORTCUTS.find((s) => s.id === id)
}

export function describeShortcut(id: string): string {
  const def = lookupShortcut(id)
  if (!def) return ""
  const isMac =
    typeof navigator !== "undefined" && /Mac/.test(navigator.platform)
  const [key] = isMac && def.macKeys ? [def.macKeys] : [def.keys]
  const words = key.split("+")
  const pretty = words
    .map((w) =>
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
                : w.toUpperCase()
    )
    .join(" ")
  return pretty
}

export function isModifierPressed(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey || e.altKey
}

export function shortcutMatches(e: KeyboardEvent, keys: string): boolean {
  const parts = keys.toLowerCase().split("+")
  const has = (mod: string) =>
    mod === "cmd" || mod === "ctrl"
      ? e.metaKey || e.ctrlKey
      : mod === "shift"
        ? e.shiftKey
        : mod === "alt"
          ? e.altKey
          : null
  for (const part of parts) {
    if (["cmd", "ctrl", "shift", "alt"].includes(part)) continue
    if (has(part) === null) continue
  }
  const wantCmd = parts.includes("cmd") || parts.includes("ctrl")
  const wantShift = parts.includes("shift")
  const wantAlt = parts.includes("alt")
  const main = parts.filter(
    (p) => !["cmd", "ctrl", "shift", "alt"].includes(p)
  )[0]
  if (!main || e.key.toLowerCase() !== main) return false
  return (
    (e.metaKey || e.ctrlKey) === wantCmd &&
    e.shiftKey === wantShift &&
    e.altKey === wantAlt
  )
}
