import { useEffect, useLayoutEffect } from "react"
import { applyTheme } from "./apply"
import { pickThemeConfig } from "./schema"
import { useThemeStore } from "./store"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const preset = useThemeStore((s) => s.preset)
  const mode = useThemeStore((s) => s.mode)
  const accent = useThemeStore((s) => s.accent)
  const gray = useThemeStore((s) => s.gray)
  const radius = useThemeStore((s) => s.radius)
  const font = useThemeStore((s) => s.font)
  const scale = useThemeStore((s) => s.scale)
  const cvd = useThemeStore((s) => s.cvd)
  const highContrast = useThemeStore((s) => s.highContrast)

  useLayoutEffect(() => {
    applyTheme(pickThemeConfig(useThemeStore.getState()))
  }, [preset, mode, accent, gray, radius, font, scale, cvd, highContrast])

  useEffect(() => {
    if (mode !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyTheme(pickThemeConfig(useThemeStore.getState()))
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [mode])

  return children
}

export { THEME_BOOTSTRAP_SCRIPT } from "./apply"
