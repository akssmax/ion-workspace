import { getThemePreset, type ThemePresetId } from "./presets"

export const THEME_STORAGE_KEY = "workspace-theme"

export type ThemeMode = "light" | "dark" | "system"
export type GrayScale = "slate" | "gray" | "zinc" | "neutral" | "stone"
export type AccentId =
  | "zinc"
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "emerald"
  | "teal"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose"
export type FontId = "inter" | "system" | "humanist" | "serif" | "mono"
export type RadiusId = "none" | "sm" | "md" | "lg" | "xl" | "full"
export type ScaleId = "sm" | "md" | "lg" | "xl"
export type CvdId =
  "none" | "deuteranopia" | "protanopia" | "tritanopia" | "achromatopsia"

export type ThemeConfig = {
  preset: ThemePresetId
  mode: ThemeMode
  accent: AccentId
  gray: GrayScale
  radius: RadiusId
  font: FontId
  scale: ScaleId
  cvd: CvdId
  highContrast: boolean
}

/** White-label brands override this object — components read the live store. */
export const DEFAULT_THEME: ThemeConfig = {
  preset: "default",
  mode: "system",
  accent: "teal",
  gray: "zinc",
  radius: "md",
  font: "inter",
  scale: "md",
  cvd: "none",
  highContrast: false,
}

export function pickThemeConfig(value: ThemeConfig): ThemeConfig {
  return {
    preset: getThemePreset(value.preset)?.id ?? "default",
    mode: value.mode,
    accent: value.accent,
    gray: value.gray,
    radius: value.radius,
    font: value.font,
    scale: value.scale,
    cvd: value.cvd,
    highContrast: value.highContrast,
  }
}

export const ACCENT_OPTIONS: {
  id: AccentId
  label: string
  /** Tailwind palette used for --color-{swatch}-* */
  swatch: string
}[] = [
  { id: "zinc", label: "Black", swatch: "zinc" },
  { id: "red", label: "Red", swatch: "red" },
  { id: "orange", label: "Orange", swatch: "orange" },
  { id: "amber", label: "Bronze", swatch: "amber" },
  { id: "yellow", label: "Yellow", swatch: "yellow" },
  { id: "lime", label: "Lime", swatch: "lime" },
  { id: "emerald", label: "Mint", swatch: "emerald" },
  { id: "teal", label: "Teal", swatch: "teal" },
  { id: "sky", label: "Sky", swatch: "sky" },
  { id: "blue", label: "Blue", swatch: "blue" },
  { id: "indigo", label: "Indigo", swatch: "indigo" },
  { id: "violet", label: "Violet", swatch: "violet" },
  { id: "purple", label: "Purple", swatch: "purple" },
  { id: "fuchsia", label: "Fuchsia", swatch: "fuchsia" },
  { id: "pink", label: "Pink", swatch: "pink" },
  { id: "rose", label: "Rose", swatch: "rose" },
]

export const GRAY_OPTIONS: { id: GrayScale; label: string }[] = [
  { id: "zinc", label: "Zinc" },
  { id: "stone", label: "Stone" },
  { id: "neutral", label: "Neutral" },
  { id: "slate", label: "Slate" },
  { id: "gray", label: "Gray" },
]

export const RADIUS_OPTIONS: { id: RadiusId; label: string; value: string }[] =
  [
    { id: "none", label: "None", value: "0px" },
    { id: "sm", label: "Small", value: "0.3rem" },
    { id: "md", label: "Default", value: "0.45rem" },
    { id: "lg", label: "Large", value: "0.75rem" },
    { id: "xl", label: "XL", value: "1rem" },
    { id: "full", label: "Full", value: "1.5rem" },
  ]

export const FONT_OPTIONS: { id: FontId; label: string; stack: string }[] = [
  {
    id: "inter",
    label: "Inter",
    stack: "'Inter Variable', ui-sans-serif, sans-serif",
  },
  {
    id: "system",
    label: "System",
    stack: "ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "humanist",
    label: "Humanist",
    stack: "Verdana, Geneva, sans-serif",
  },
  {
    id: "serif",
    label: "Serif",
    stack: "ui-serif, Georgia, 'Times New Roman', serif",
  },
  {
    id: "mono",
    label: "Mono",
    stack: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
]

export const SCALE_OPTIONS: { id: ScaleId; label: string; px: number }[] = [
  { id: "sm", label: "S", px: 14 },
  { id: "md", label: "M", px: 16 },
  { id: "lg", label: "L", px: 18 },
  { id: "xl", label: "XL", px: 20 },
]

export const CVD_OPTIONS: { id: CvdId; label: string; hint: string }[] = [
  { id: "none", label: "Default", hint: "Full color" },
  {
    id: "deuteranopia",
    label: "Deuteranopia",
    hint: "Red–green (green-weak)",
  },
  { id: "protanopia", label: "Protanopia", hint: "Red–green (red-weak)" },
  { id: "tritanopia", label: "Tritanopia", hint: "Blue–yellow" },
  {
    id: "achromatopsia",
    label: "Achromatopsia",
    hint: "No color, higher contrast",
  },
]

export function isThemeConfig(value: unknown): value is ThemeConfig {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return (
    typeof v.mode === "string" &&
    typeof v.accent === "string" &&
    typeof v.gray === "string" &&
    typeof v.radius === "string" &&
    typeof v.font === "string" &&
    typeof v.scale === "string" &&
    typeof v.cvd === "string" &&
    typeof v.highContrast === "boolean"
  )
}
