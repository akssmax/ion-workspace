/**
 * Shared accent palette: Tailwind 200 fills with 800 text
 * (dark: 900 fills with 200 text). Used by labels, calendar events, and docs.
 */

export const ACCENT_NAMES = [
  "red",
  "orange",
  "amber",
  "lime",
  "emerald",
  "teal",
  "sky",
  "blue",
  "violet",
  "fuchsia",
] as const

export type AccentName = (typeof ACCENT_NAMES)[number]

export type AccentClasses = {
  bg: string
  text: string
  /** Foreground tint for icons on the surrounding surface (sidebar, rows). */
  icon: string
  ring: string
  dot: string
}

/** Full class strings so Tailwind's scanner can emit them. */
export const ACCENT_CLASSES: Record<AccentName, AccentClasses> = {
  red: {
    bg: "bg-red-200 dark:bg-red-900",
    text: "text-red-800 dark:text-red-200",
    icon: "text-red-600 dark:text-red-400",
    ring: "ring-red-400 dark:ring-red-600",
    dot: "bg-red-500",
  },
  orange: {
    bg: "bg-orange-200 dark:bg-orange-900",
    text: "text-orange-800 dark:text-orange-200",
    icon: "text-orange-600 dark:text-orange-400",
    ring: "ring-orange-400 dark:ring-orange-600",
    dot: "bg-orange-500",
  },
  amber: {
    bg: "bg-amber-200 dark:bg-amber-900",
    text: "text-amber-800 dark:text-amber-200",
    icon: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-400 dark:ring-amber-600",
    dot: "bg-amber-500",
  },
  lime: {
    bg: "bg-lime-200 dark:bg-lime-900",
    text: "text-lime-800 dark:text-lime-200",
    icon: "text-lime-600 dark:text-lime-400",
    ring: "ring-lime-400 dark:ring-lime-600",
    dot: "bg-lime-500",
  },
  emerald: {
    bg: "bg-emerald-200 dark:bg-emerald-900",
    text: "text-emerald-800 dark:text-emerald-200",
    icon: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-400 dark:ring-emerald-600",
    dot: "bg-emerald-500",
  },
  teal: {
    bg: "bg-teal-200 dark:bg-teal-900",
    text: "text-teal-800 dark:text-teal-200",
    icon: "text-teal-600 dark:text-teal-400",
    ring: "ring-teal-400 dark:ring-teal-600",
    dot: "bg-teal-500",
  },
  sky: {
    bg: "bg-sky-200 dark:bg-sky-900",
    text: "text-sky-800 dark:text-sky-200",
    icon: "text-sky-600 dark:text-sky-400",
    ring: "ring-sky-400 dark:ring-sky-600",
    dot: "bg-sky-500",
  },
  blue: {
    bg: "bg-blue-200 dark:bg-blue-900",
    text: "text-blue-800 dark:text-blue-200",
    icon: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-400 dark:ring-blue-600",
    dot: "bg-blue-500",
  },
  violet: {
    bg: "bg-violet-200 dark:bg-violet-900",
    text: "text-violet-800 dark:text-violet-200",
    icon: "text-violet-600 dark:text-violet-400",
    ring: "ring-violet-400 dark:ring-violet-600",
    dot: "bg-violet-500",
  },
  fuchsia: {
    bg: "bg-fuchsia-200 dark:bg-fuchsia-900",
    text: "text-fuchsia-800 dark:text-fuchsia-200",
    icon: "text-fuchsia-600 dark:text-fuchsia-400",
    ring: "ring-fuchsia-400 dark:ring-fuchsia-600",
    dot: "bg-fuchsia-500",
  },
}

export function isAccentName(value: string): value is AccentName {
  return (ACCENT_NAMES as readonly string[]).includes(value)
}

/** Parse a stored color: palette key, otherwise null (caller may treat as hex). */
export function parseAccent(color?: string | null): AccentName | null {
  if (!color) return null
  return isAccentName(color) ? color : null
}

export function isHexColor(color: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)
}

export function accentClasses(name: AccentName): AccentClasses {
  return ACCENT_CLASSES[name]
}

/** Stable hue for mailbox / calendar ids without a stored color. */
export function accentForKey(key: string): AccentName {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return ACCENT_NAMES[hash % ACCENT_NAMES.length]
}

export function resolveAccent(
  color: string | null | undefined,
  fallbackKey: string
): AccentName {
  return parseAccent(color) ?? accentForKey(fallbackKey)
}
