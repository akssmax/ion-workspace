import {
  ACCENT_OPTIONS,
  DEFAULT_THEME,
  FONT_OPTIONS,
  RADIUS_OPTIONS,
  SCALE_OPTIONS,
  THEME_STORAGE_KEY,
  pickThemeConfig,
} from "./schema"
import type { AccentId, CvdId, ThemeConfig, ThemeMode } from "./schema"
import { getThemePreset, THEME_PRESETS } from "./presets"

const DEUTAN_UNSAFE: AccentId[] = ["red", "lime", "emerald", "rose"]
const TRITAN_UNSAFE: AccentId[] = ["blue", "sky", "yellow", "amber", "indigo"]

export function resolveDark(mode: ThemeMode): boolean {
  if (mode === "dark") return true
  if (mode === "light") return false
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function remapAccent(accent: AccentId, cvd: CvdId): AccentId {
  if (cvd === "deuteranopia" || cvd === "protanopia") {
    return DEUTAN_UNSAFE.includes(accent) ? "blue" : accent
  }
  if (cvd === "tritanopia") {
    return TRITAN_UNSAFE.includes(accent) ? "rose" : accent
  }
  return accent
}

function swatchFor(accent: AccentId): string {
  return ACCENT_OPTIONS.find((o) => o.id === accent)?.swatch ?? "teal"
}

function setVar(root: HTMLElement, name: string, value: string) {
  root.style.setProperty(name, value)
}

function grayToken(gray: string, shade: number | string) {
  return `var(--color-${gray}-${shade})`
}

function accentToken(swatch: string, shade: number | string) {
  return `var(--color-${swatch}-${shade})`
}

export function applyTheme(
  theme: ThemeConfig,
  root: HTMLElement = document.documentElement
) {
  const config = pickThemeConfig(theme)
  const dark = resolveDark(config.mode)
  const accent = remapAccent(config.accent, config.cvd)
  const swatch = swatchFor(accent)
  const gray = config.gray
  const radius =
    RADIUS_OPTIONS.find((o) => o.id === config.radius)?.value ?? "0.45rem"
  const font =
    FONT_OPTIONS.find((o) => o.id === config.font)?.stack ??
    FONT_OPTIONS[0].stack
  const scale = SCALE_OPTIONS.find((o) => o.id === config.scale)?.px ?? 16
  const contrast = config.highContrast || config.cvd === "achromatopsia"

  root.classList.toggle("dark", dark)
  root.style.colorScheme = dark ? "dark" : "light"
  root.style.fontSize = `${scale}px`
  root.dataset.themeAccent = accent
  root.dataset.themePreset = config.preset
  root.dataset.themeGray = gray
  root.dataset.themeCvd = config.cvd
  root.dataset.themeScale = config.scale
  root.dataset.themeFont = config.font
  root.dataset.themeRadius = config.radius

  setVar(root, "--radius", radius)
  setVar(root, "--font-sans", font)
  setVar(root, "--font-heading", font)

  if (dark) {
    setVar(root, "--background", grayToken(gray, 950))
    setVar(root, "--foreground", grayToken(gray, contrast ? 50 : 100))
    setVar(root, "--card", grayToken(gray, 900))
    setVar(root, "--card-foreground", grayToken(gray, 50))
    setVar(root, "--popover", grayToken(gray, 900))
    setVar(root, "--popover-foreground", grayToken(gray, 50))
    setVar(root, "--muted", grayToken(gray, contrast ? 800 : 800))
    setVar(root, "--muted-foreground", grayToken(gray, contrast ? 300 : 400))
    setVar(root, "--secondary", grayToken(gray, 800))
    setVar(root, "--secondary-foreground", grayToken(gray, 50))
    setVar(root, "--accent", grayToken(gray, 800))
    setVar(root, "--accent-foreground", grayToken(gray, 50))
    setVar(
      root,
      "--border",
      contrast ? "oklch(1 0 0 / 18%)" : "oklch(1 0 0 / 10%)"
    )
    setVar(root, "--input", "oklch(1 0 0 / 15%)")
    setVar(root, "--ring", grayToken(gray, 400))
    setVar(root, "--sidebar", grayToken(gray, 900))
    setVar(root, "--sidebar-foreground", grayToken(gray, 50))
    setVar(root, "--sidebar-accent", grayToken(gray, 800))
    setVar(root, "--sidebar-accent-foreground", grayToken(gray, 50))
    setVar(root, "--sidebar-border", "oklch(1 0 0 / 10%)")
    setVar(root, "--sidebar-ring", grayToken(gray, 400))
    setVar(
      root,
      "--primary",
      accentToken(swatch, swatch === "zinc" ? 200 : 400)
    )
    setVar(
      root,
      "--primary-foreground",
      accentToken(swatch, swatch === "zinc" ? 950 : 950)
    )
    setVar(
      root,
      "--sidebar-primary",
      accentToken(swatch, swatch === "zinc" ? 200 : 400)
    )
    setVar(root, "--sidebar-primary-foreground", accentToken(swatch, 950))
  } else {
    setVar(
      root,
      "--background",
      contrast ? grayToken(gray, 50) : "oklch(1 0 0)"
    )
    setVar(root, "--foreground", grayToken(gray, 950))
    setVar(root, "--card", "oklch(1 0 0)")
    setVar(root, "--card-foreground", grayToken(gray, 950))
    setVar(root, "--popover", "oklch(1 0 0)")
    setVar(root, "--popover-foreground", grayToken(gray, 950))
    setVar(root, "--muted", grayToken(gray, contrast ? 200 : 100))
    setVar(root, "--muted-foreground", grayToken(gray, contrast ? 700 : 500))
    setVar(root, "--secondary", grayToken(gray, 100))
    setVar(root, "--secondary-foreground", grayToken(gray, 900))
    setVar(root, "--accent", grayToken(gray, 100))
    setVar(root, "--accent-foreground", grayToken(gray, 900))
    setVar(root, "--border", grayToken(gray, contrast ? 300 : 200))
    setVar(root, "--input", grayToken(gray, 200))
    setVar(root, "--ring", grayToken(gray, 400))
    setVar(root, "--sidebar", grayToken(gray, 50))
    setVar(root, "--sidebar-foreground", grayToken(gray, 950))
    setVar(root, "--sidebar-accent", grayToken(gray, 100))
    setVar(root, "--sidebar-accent-foreground", grayToken(gray, 900))
    setVar(root, "--sidebar-border", grayToken(gray, 200))
    setVar(root, "--sidebar-ring", grayToken(gray, 400))
    setVar(
      root,
      "--primary",
      accentToken(swatch, swatch === "zinc" ? 900 : 600)
    )
    setVar(
      root,
      "--primary-foreground",
      swatch === "zinc" ? grayToken(gray, 50) : "oklch(1 0 0)"
    )
    setVar(
      root,
      "--sidebar-primary",
      accentToken(swatch, swatch === "zinc" ? 900 : 600)
    )
    setVar(
      root,
      "--sidebar-primary-foreground",
      swatch === "zinc" ? grayToken(gray, 50) : "oklch(1 0 0)"
    )
  }

  applyStatus(root, config.cvd, dark)
  applyCvdFilter(root, config.cvd)

  setVar(root, "--chart-1", grayToken(gray, 200))
  setVar(root, "--chart-2", grayToken(gray, 400))
  setVar(root, "--chart-3", grayToken(gray, 600))
  setVar(root, "--chart-4", grayToken(gray, 700))
  setVar(root, "--chart-5", grayToken(gray, 800))

  // Reset tokens owned by presets before applying the next palette.
  setVar(
    root,
    "--destructive",
    dark ? "oklch(0.704 0.191 22.216)" : "oklch(0.577 0.245 27.325)"
  )
  setVar(root, "--destructive-foreground", "#ffffff")
  const preset = getThemePreset(config.preset)
  if (preset && !contrast && config.cvd === "none") {
    for (const [name, value] of Object.entries(
      preset[dark ? "dark" : "light"]
    )) {
      setVar(root, `--${name}`, value)
    }
  }
}

function applyStatus(root: HTMLElement, cvd: CvdId, dark: boolean) {
  let success = "emerald"
  let warning = "amber"
  let info = "sky"
  if (cvd === "deuteranopia" || cvd === "protanopia") {
    success = "sky"
    warning = "amber"
    info = "violet"
  } else if (cvd === "tritanopia") {
    success = "emerald"
    warning = "rose"
    info = "pink"
  }

  if (dark) {
    setVar(root, "--success", `var(--color-${success}-900)`)
    setVar(root, "--success-foreground", `var(--color-${success}-200)`)
    setVar(root, "--warning", `var(--color-${warning}-900)`)
    setVar(root, "--warning-foreground", `var(--color-${warning}-200)`)
    setVar(root, "--info", `var(--color-${info}-900)`)
    setVar(root, "--info-foreground", `var(--color-${info}-200)`)
  } else {
    setVar(root, "--success", `var(--color-${success}-200)`)
    setVar(root, "--success-foreground", `var(--color-${success}-800)`)
    setVar(root, "--warning", `var(--color-${warning}-200)`)
    setVar(root, "--warning-foreground", `var(--color-${warning}-800)`)
    setVar(root, "--info", `var(--color-${info}-200)`)
    setVar(root, "--info-foreground", `var(--color-${info}-800)`)
  }
}

function applyCvdFilter(root: HTMLElement, cvd: CvdId) {
  if (cvd === "achromatopsia") {
    root.style.filter = "grayscale(1) contrast(1.12)"
  } else {
    root.style.filter = ""
  }
}

export function parseStoredTheme(raw: string | null): ThemeConfig {
  if (!raw) return DEFAULT_THEME
  try {
    const parsed = JSON.parse(raw) as { state?: Partial<ThemeConfig> }
    return { ...DEFAULT_THEME, ...parsed.state }
  } catch {
    return DEFAULT_THEME
  }
}

/** Inline head script so the first paint matches stored theme (no FOUC). */
export function themeBootstrapScript(storageKey: string): string {
  const defaults = JSON.stringify(DEFAULT_THEME)
  // Only ship the color tokens the first paint needs, not labels/descriptions.
  const presetTokens = JSON.stringify(
    THEME_PRESETS.map((preset) => ({
      id: preset.id,
      light: preset.light,
      dark: preset.dark,
    }))
  )
  return `(function(){try{var k=${JSON.stringify(storageKey)};var d=${defaults};var t=Object.assign({},d);var demo=/^\\/demo\\/?$/.test(location.pathname);var raw=demo?null:localStorage.getItem(k);if(demo){t.mode="light";t.accent="zinc";}if(raw){var p=JSON.parse(raw);if(p&&p.state)t=Object.assign({},d,p.state);}var dark=t.mode==='dark'||(t.mode!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',dark);r.style.colorScheme=dark?'dark':'light';var scales={sm:14,md:16,lg:18,xl:20};r.style.fontSize=(scales[t.scale]||16)+'px';var radii={none:'0px',sm:'0.3rem',md:'0.45rem',lg:'0.75rem',xl:'1rem',full:'1.5rem'};r.style.setProperty('--radius',radii[t.radius]||'0.45rem');var fonts={inter:"'Inter Variable', ui-sans-serif, sans-serif",system:'ui-sans-serif, system-ui, sans-serif',humanist:'Verdana, Geneva, sans-serif',serif:"ui-serif, Georgia, 'Times New Roman', serif",mono:'ui-monospace, SFMono-Regular, Menlo, monospace'};var font=fonts[t.font]||fonts.inter;r.style.setProperty('--font-sans',font);r.style.setProperty('--font-heading',font);var accent=t.accent;if((t.cvd==='deuteranopia'||t.cvd==='protanopia')&&['red','lime','emerald','rose'].indexOf(accent)>=0)accent='blue';if(t.cvd==='tritanopia'&&['blue','sky','yellow','amber','indigo'].indexOf(accent)>=0)accent='rose';var swatch=accent==='zinc'?'zinc':accent;var gray=t.gray||'zinc';r.style.setProperty('--background',dark?'var(--color-'+gray+'-950)':'oklch(1 0 0)');r.style.setProperty('--foreground',dark?'var(--color-'+gray+'-100)':'var(--color-'+gray+'-950)');r.style.setProperty('--primary',dark?(swatch==='zinc'?'var(--color-zinc-200)':'var(--color-'+swatch+'-400)'):(swatch==='zinc'?'var(--color-zinc-900)':'var(--color-'+swatch+'-600)'));if(t.cvd==='achromatopsia')r.style.filter='grayscale(1) contrast(1.12)';var presets=${presetTokens};var preset=presets.find(function(p){return p.id===t.preset;});r.dataset.themePreset=preset?preset.id:'default';if(preset&&!t.highContrast&&t.cvd==='none'){var colors=preset[dark?'dark':'light'];Object.keys(colors).forEach(function(key){r.style.setProperty('--'+key,colors[key]);});}}catch(e){}})();`
}

export const THEME_BOOTSTRAP_SCRIPT = themeBootstrapScript(THEME_STORAGE_KEY)
