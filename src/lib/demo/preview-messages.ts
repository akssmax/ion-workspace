export const DEMO_SURFACES = ["mail", "calendar", "contacts", "files"] as const
export type DemoSurface = (typeof DEMO_SURFACES)[number]
export function isDemoSurface(value: unknown): value is DemoSurface {
  return (
    typeof value === "string" &&
    DEMO_SURFACES.some((surface) => surface === value)
  )
}
export function isPreviewConfig(
  value: unknown
): value is {
  type: "ion:preview-config"
  surface: DemoSurface
  theme: "light" | "dark"
} {
  if (!value || typeof value !== "object") return false
  const data = value as Record<string, unknown>
  return (
    data.type === "ion:preview-config" &&
    isDemoSurface(data.surface) &&
    (data.theme === "light" || data.theme === "dark")
  )
}
