import { useEffect, useId, useState } from "react"
import { Check, RotateCcw } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  ACCENT_OPTIONS,
  CVD_OPTIONS,
  FONT_OPTIONS,
  GRAY_OPTIONS,
  RADIUS_OPTIONS,
  SCALE_OPTIONS,
  type AccentId,
  type CvdId,
  type FontId,
  type GrayScale,
  type RadiusId,
  type ScaleId,
  type ThemeMode,
} from "@/theme/schema"
import { useThemeStore } from "@/theme/store"

const SWATCH_BG: Record<string, string> = {
  zinc: "bg-zinc-500",
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  yellow: "bg-yellow-400",
  lime: "bg-lime-500",
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
  sky: "bg-sky-500",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  purple: "bg-purple-500",
  fuchsia: "bg-fuchsia-500",
  pink: "bg-pink-500",
  rose: "bg-rose-500",
  stone: "bg-stone-500",
  neutral: "bg-neutral-500",
  slate: "bg-slate-500",
  gray: "bg-gray-500",
}

export function ThemeController({
  variant = "page",
}: {
  variant?: "page" | "compact"
}) {
  const theme = useThemeStore()
  const gap = variant === "compact" ? "space-y-5" : "space-y-8"
  const contrastId = useId()
  const compact = variant === "compact"
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className="h-64 animate-pulse rounded-2xl bg-muted/40"
        aria-hidden
      />
    )
  }

  return (
    <div className={gap}>
      <ThemeField label="Appearance">
        <div className="grid grid-cols-3 gap-2">
          <AppearanceCard
            mode="light"
            label="Light"
            selected={theme.mode === "light"}
            onSelect={() => theme.setTheme({ mode: "light" })}
          />
          <AppearanceCard
            mode="dark"
            label="Dark"
            selected={theme.mode === "dark"}
            onSelect={() => theme.setTheme({ mode: "dark" })}
          />
          <AppearanceCard
            mode="system"
            label="Auto"
            selected={theme.mode === "system"}
            onSelect={() => theme.setTheme({ mode: "system" })}
          />
        </div>
      </ThemeField>

      <ThemeField
        label="Accent"
        hint={
          compact
            ? undefined
            : "Brand color for buttons, unread dots, and the sidebar mark."
        }
      >
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {ACCENT_OPTIONS.map((opt) => (
            <SwatchButton
              key={opt.id}
              label={opt.label}
              selected={theme.accent === opt.id}
              swatch={opt.swatch}
              onSelect={() => theme.setTheme({ accent: opt.id as AccentId })}
            />
          ))}
        </div>
      </ThemeField>

      <ThemeField
        label="Base gray"
        hint={
          compact
            ? undefined
            : "Neutral surfaces — zinc, stone, and the rest of Tailwind’s gray ramps."
        }
      >
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {GRAY_OPTIONS.map((opt) => (
            <SwatchButton
              key={opt.id}
              label={opt.label}
              selected={theme.gray === opt.id}
              swatch={opt.id}
              onSelect={() => theme.setTheme({ gray: opt.id as GrayScale })}
            />
          ))}
        </div>
      </ThemeField>

      <ThemeField label="Radius">
        <div className="flex flex-wrap gap-1.5">
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              aria-pressed={theme.radius === opt.id}
              onClick={() => theme.setTheme({ radius: opt.id as RadiusId })}
              className={cn(
                "flex h-11 w-11 items-center justify-center border transition-colors",
                theme.radius === opt.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted/60"
              )}
              style={{ borderRadius: opt.value }}
              title={opt.label}
            >
              <span
                className="size-5 border border-foreground/40"
                style={{ borderRadius: opt.value }}
              />
              <span className="sr-only">{opt.label}</span>
            </button>
          ))}
        </div>
      </ThemeField>

      <ThemeField label="Typeface">
        <div className="grid gap-1.5">
          {FONT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              aria-pressed={theme.font === opt.id}
              onClick={() => theme.setTheme({ font: opt.id as FontId })}
              className={cn(
                "flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                theme.font === opt.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted/60"
              )}
              style={{ fontFamily: opt.stack }}
            >
              {opt.label}
              {theme.font === opt.id ? <Check className="size-4" /> : null}
            </button>
          ))}
        </div>
      </ThemeField>

      <ThemeField
        label="Scale"
        hint={
          compact ? undefined : "Root font size. Spacing and type both scale."
        }
      >
        <div className="flex rounded-xl border p-0.5">
          {SCALE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              aria-pressed={theme.scale === opt.id}
              onClick={() => theme.setTheme({ scale: opt.id as ScaleId })}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors",
                theme.scale === opt.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
              <span className="mt-0.5 block text-[10px] opacity-70">
                {opt.px}px
              </span>
            </button>
          ))}
        </div>
      </ThemeField>

      <ThemeField
        label="Color vision"
        hint={
          compact
            ? undefined
            : "Remaps brand and status hues so they stay distinguishable. Achromatopsia uses grayscale plus extra contrast."
        }
      >
        <div className="grid gap-1.5">
          {CVD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              aria-pressed={theme.cvd === opt.id}
              onClick={() => theme.setTheme({ cvd: opt.id as CvdId })}
              className={cn(
                "flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors",
                theme.cvd === opt.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted/60"
              )}
            >
              <span>
                <span className="block text-sm font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.hint}</span>
              </span>
              {theme.cvd === opt.id ? <Check className="size-4 shrink-0" /> : null}
            </button>
          ))}
        </div>
      </ThemeField>

      <div className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
        <div>
          <Label htmlFor={contrastId} className="text-sm">
            High contrast
          </Label>
          <p className="text-xs text-muted-foreground">
            Stronger borders and text against surfaces.
          </p>
        </div>
        <Switch
          id={contrastId}
          checked={theme.highContrast}
          onCheckedChange={(checked) =>
            theme.setTheme({ highContrast: Boolean(checked) })
          }
        />
      </div>

      <Separator />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => theme.resetTheme()}
      >
        <RotateCcw className="size-3.5" />
        Reset to defaults
      </Button>
    </div>
  )
}

function ThemeField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs font-medium text-muted-foreground">
        {label}
      </legend>
      {hint ? (
        <p className="mb-2 text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {children}
    </fieldset>
  )
}

function SwatchButton({
  label,
  swatch,
  selected,
  onSelect,
}: {
  label: string
  swatch: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm text-foreground transition-colors",
        selected
          ? "border-primary bg-primary/10 font-medium"
          : "border-border hover:bg-muted/60"
      )}
    >
      <span
        className={cn(
          "size-4 shrink-0 rounded-full ring-1 ring-foreground/15",
          SWATCH_BG[swatch] ?? "bg-zinc-500"
        )}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {selected ? <Check className="size-3.5 shrink-0" /> : null}
    </button>
  )
}

function AppearanceCard({
  mode,
  label,
  selected,
  onSelect,
}: {
  mode: ThemeMode
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-1.5 rounded-xl p-1 text-center transition-colors",
        selected ? "ring-2 ring-primary" : "ring-1 ring-border hover:bg-muted/40"
      )}
    >
      <AppearancePreview mode={mode} accentVar="var(--primary)" />
      <span className="pb-1 text-xs font-medium">{label}</span>
    </button>
  )
}

function AppearancePreview({
  mode,
  accentVar,
}: {
  mode: ThemeMode
  accentVar: string
}) {
  if (mode === "system") {
    return (
      <div className="flex h-16 overflow-hidden rounded-lg border">
        <MiniUi className="w-1/2 bg-zinc-50" bar="bg-zinc-200" accent={accentVar} />
        <MiniUi className="w-1/2 bg-zinc-950" bar="bg-zinc-700" accent={accentVar} />
      </div>
    )
  }
  const dark = mode === "dark"
  return (
    <div
      className={cn(
        "h-16 overflow-hidden rounded-lg border",
        dark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50"
      )}
    >
      <MiniUi
        className="h-full w-full"
        bar={dark ? "bg-zinc-700" : "bg-zinc-200"}
        accent={accentVar}
      />
    </div>
  )
}

function MiniUi({
  className,
  bar,
  accent,
}: {
  className?: string
  bar: string
  accent: string
}) {
  return (
    <div className={cn("flex gap-1 p-1.5", className)}>
      <div className="flex w-3.5 shrink-0 flex-col gap-0.5">
        <span
          className="size-2 rounded-[2px]"
          style={{ background: accent }}
        />
        <span className={cn("h-1 w-2.5 rounded-full", bar)} />
        <span className={cn("h-1 w-2.5 rounded-full", bar)} />
        <span className={cn("h-1 w-2 rounded-full", bar)} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
        <span className={cn("h-1 w-3/4 rounded-full", bar)} />
        <span
          className="h-1 w-1/2 rounded-full"
          style={{ background: accent, opacity: 0.7 }}
        />
        <span className={cn("h-1 w-2/3 rounded-full", bar)} />
      </div>
    </div>
  )
}
