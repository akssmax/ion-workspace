import { Check } from "lucide-react"
import { cn } from "cn"
import { THEME_PRESETS } from "@/theme/presets"
import { useResolvedDark, useThemeStore } from "@/theme/store"

export function ThemeGallery() {
  const theme = useThemeStore()
  const dark = useResolvedDark()
  const defaults = {
    background: dark ? "#09090b" : "#ffffff",
    foreground: dark ? "#f4f4f5" : "#09090b",
    sidebar: dark ? "#18181b" : "#fafafa",
    primary: dark ? "#2dd4bf" : "#0d9488",
    muted: dark ? "#27272a" : "#f4f4f5",
    border: dark ? "#3f3f46" : "#e4e4e7",
  }
  const options = [
    {
      id: "default" as const,
      label: "Default",
      description: "Our original look, with your custom colors.",
      light: defaults,
      dark: defaults,
    },
    ...THEME_PRESETS,
  ]

  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">Themes</legend>
      <p className="mb-4 text-xs text-muted-foreground">
        Select a look to apply it instantly. Every theme supports Light, Dark,
        and Auto.
      </p>
      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
        {options.map((option) => {
          const colors = option[dark ? "dark" : "light"]
          const selected = theme.preset === option.id
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => theme.setTheme({ preset: option.id })}
              className={cn(
                "overflow-hidden rounded-xl border text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
                selected
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-foreground/40"
              )}
            >
              <div
                aria-hidden="true"
                className="flex h-24 gap-3 border-b p-3"
                style={{
                  background: colors.background,
                  borderColor: colors.border,
                }}
              >
                <div
                  className="flex w-10 flex-col gap-2 rounded-md p-2"
                  style={{ background: colors.sidebar }}
                >
                  <div
                    className="h-3 w-3 rounded"
                    style={{ background: colors.primary }}
                  />
                  <div
                    className="h-1 w-full rounded"
                    style={{ background: colors.foreground, opacity: 0.25 }}
                  />
                  <div
                    className="h-1 w-3/4 rounded"
                    style={{ background: colors.foreground, opacity: 0.25 }}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 py-1">
                  <div
                    className="h-2 w-1/2 rounded"
                    style={{ background: colors.foreground }}
                  />
                  <div
                    className="h-4 rounded"
                    style={{ background: colors.muted }}
                  />
                  <div
                    className="h-4 w-12 rounded-full"
                    style={{ background: colors.primary }}
                  />
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between gap-2 text-sm font-medium">
                  {option.label}
                  {selected ? <Check className="size-4 text-primary" /> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {option.description}
                </p>
                <div aria-hidden="true" className="mt-3 flex gap-1.5">
                  {[
                    colors.primary,
                    colors.sidebar,
                    colors.muted,
                    colors.foreground,
                  ].map((color, index) => (
                    <span
                      key={index}
                      className="size-3.5 rounded-full border border-foreground/15"
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {theme.highContrast || theme.cvd !== "none" ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Your accessibility palette takes priority. Turn off high contrast and
          choose Default color vision to see the selected theme’s colors.
        </p>
      ) : null}
    </fieldset>
  )
}
