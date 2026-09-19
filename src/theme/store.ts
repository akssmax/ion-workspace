import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { workspaceStorage, isDemoRuntime } from "@/lib/demo/runtime"
import { useSyncExternalStore } from "react"
import { applyTheme } from "./apply"
import { DEFAULT_THEME, THEME_STORAGE_KEY, pickThemeConfig } from "./schema"
import type { ThemeConfig } from "./schema"

type ThemeStore = ThemeConfig & {
  setTheme: (patch: Partial<ThemeConfig>) => void
  resetTheme: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // Default only — persist rehydrates after mount so SSR matches hydrate.
      ...DEFAULT_THEME,
      ...(isDemoRuntime
        ? { mode: "light" as const, accent: "zinc" as const }
        : {}),
      setTheme: (patch) => {
        set(patch)
        applyTheme(pickThemeConfig(get()))
      },
      resetTheme: () => {
        set({ ...DEFAULT_THEME })
        applyTheme({ ...DEFAULT_THEME })
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(workspaceStorage),
      partialize: (state) => pickThemeConfig(state),
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== "undefined") {
          applyTheme(pickThemeConfig(state))
        }
      },
    }
  )
)

function subscribeSystemDark(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  mq.addEventListener("change", onStoreChange)
  return () => mq.removeEventListener("change", onStoreChange)
}

export function useResolvedDark() {
  const mode = useThemeStore((s) => s.mode)
  const systemDark = useSyncExternalStore(
    subscribeSystemDark,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false
  )
  if (mode === "dark") return true
  if (mode === "light") return false
  return systemDark
}
