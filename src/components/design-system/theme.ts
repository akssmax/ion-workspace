import { useThemeStore, useResolvedDark } from "@/theme/store"

export type DocsTheme = {
  dark: boolean
  setDark: (dark: boolean) => void
}

/** Bridge so design-system pages follow the shared app theme. */
export function useDocsTheme(): DocsTheme {
  const setTheme = useThemeStore((s) => s.setTheme)
  const dark = useResolvedDark()
  return {
    dark,
    setDark: (next) => setTheme({ mode: next ? "dark" : "light" }),
  }
}
