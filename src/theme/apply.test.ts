// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { applyTheme, parseStoredTheme, themeBootstrapScript } from "./apply"
import { DEFAULT_THEME, pickThemeConfig } from "./schema"
import { THEME_PRESETS } from "./presets"

beforeEach(() => {
  document.documentElement.removeAttribute("style")
  localStorage.clear()
  vi.stubGlobal("matchMedia", () => ({ matches: false }))
})

describe("theme palettes", () => {
  for (const preset of THEME_PRESETS) {
    for (const mode of ["light", "dark"] as const) {
      it(`applies ${preset.label} in ${mode} mode and restores Default`, () => {
        const root = document.documentElement
        applyTheme({ ...DEFAULT_THEME, mode })
        const original = root.style.cssText
        applyTheme({ ...DEFAULT_THEME, mode, preset: preset.id })
        for (const [key, value] of Object.entries(preset[mode])) {
          expect(root.style.getPropertyValue(`--${key}`)).toBe(value)
        }
        expect(root.classList.contains("dark")).toBe(mode === "dark")
        applyTheme({ ...DEFAULT_THEME, mode })
        expect(root.style.cssText).toBe(original)
      })
    }
  }

  it("restores saved palette colors before hydration", () => {
    const preset = THEME_PRESETS[1]
    localStorage.setItem(
      "workspace-theme",
      JSON.stringify({
        state: { ...DEFAULT_THEME, mode: "dark", preset: preset.id },
      })
    )
    new Function(themeBootstrapScript("workspace-theme"))()
    expect(
      document.documentElement.style.getPropertyValue("--background")
    ).toBe(preset.dark.background)
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe(
      preset.dark.primary
    )
  })

  it("keeps accessibility settings ahead of decorative palettes", () => {
    const root = document.documentElement
    applyTheme({ ...DEFAULT_THEME, mode: "light", highContrast: true })
    const accessible = root.style.cssText
    applyTheme({
      ...DEFAULT_THEME,
      mode: "light",
      highContrast: true,
      preset: "candyland",
    })
    expect(root.style.cssText).toBe(accessible)
  })

  it("accepts older saved settings and falls back for unknown presets", () => {
    expect(parseStoredTheme('{"state":{"mode":"dark"}}').preset).toBe("default")
    const stored = parseStoredTheme('{"state":{"preset":"removed-theme"}}')
    expect(pickThemeConfig(stored).preset).toBe("default")
  })

  it("resolves Auto against the current system appearance", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }))
    applyTheme({ ...DEFAULT_THEME, preset: "catppuccin" })
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(
      document.documentElement.style.getPropertyValue("--background")
    ).toBe(THEME_PRESETS[1].dark.background)
  })
})
