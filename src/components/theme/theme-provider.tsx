import { useThemeStore, useResolvedDark } from "@/theme/store"
import type { ThemeMode } from "@/theme/schema"

export { ThemeProvider, THEME_BOOTSTRAP_SCRIPT } from "@/theme/provider"
export { THEME_STORAGE_KEY as THEME_KEY } from "@/theme/schema"

export type Theme = ThemeMode
export type ResolvedTheme = "light" | "dark"

/** Compatibility hook for light/dark/system callers. */
export function useTheme() {
  const theme = useThemeStore((s) => s.mode)
  const setThemeStore = useThemeStore((s) => s.setTheme)
  const dark = useResolvedDark()
  return {
    theme,
    resolved: (dark ? "dark" : "light") as ResolvedTheme,
    setTheme: (next: Theme) => setThemeStore({ mode: next }),
  }
}
