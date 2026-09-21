import { useEffect, useRef } from "react"
import { usePreferences, useSavePreferences } from "@/queries/preferences"
import { useSession } from "@/hooks/use-session"
import { isDemoRuntime, workspaceStorage } from "@/lib/demo/runtime"
import { useThemeStore } from "./store"
import { DEFAULT_THEME, THEME_STORAGE_KEY, pickThemeConfig } from "./schema"
import type { ThemeConfig } from "./schema"

/**
 * Marks which account the browser-local theme cache belongs to, so a shared
 * browser does not leak one user's theme into another's fresh session.
 */
const OWNER_KEY = `${THEME_STORAGE_KEY}-owner`

function readOwner(): string | null {
  try {
    return workspaceStorage().getItem(OWNER_KEY)
  } catch {
    return null
  }
}

function writeOwner(userId: string | null) {
  try {
    if (userId) workspaceStorage().setItem(OWNER_KEY, userId)
    else workspaceStorage().removeItem(OWNER_KEY)
  } catch {
    // Storage unavailable; the server copy is still authoritative.
  }
}

function sameTheme(a: ThemeConfig, b: ThemeConfig): boolean {
  return (
    JSON.stringify(pickThemeConfig(a)) === JSON.stringify(pickThemeConfig(b))
  )
}

/**
 * Keeps the local theme store and the per-user server preference in sync.
 *
 * - The server preference is the source of truth once a user is signed in.
 * - A signed-in user with no stored theme adopts their local choice (or the
 *   default when the local cache belonged to a different account).
 * - Local theme changes are pushed back to the server (debounced).
 */
export function ThemeSync() {
  const session = useSession()
  const userId = session.data?.userId ?? null
  const { data: prefs, isSuccess } = usePreferences()
  const save = useSavePreferences()

  // The theme last known to be persisted server-side, used to ignore the echo
  // of our own writes and avoid a save loop.
  const serverThemeRef = useRef<ThemeConfig | null>(null)
  // Users for whom we've already seeded a first theme, so a failing save does
  // not retry in a loop.
  const seededForRef = useRef<string | null>(null)
  const saveRef = useRef(save)
  saveRef.current = save

  useEffect(() => {
    if (isDemoRuntime || !isSuccess) return

    if (!userId) {
      // Signed out: keep the cache (and its owner marker) for first paint.
      // The marker lets the next, different account start from defaults.
      serverThemeRef.current = null
      return
    }

    const stored = prefs.theme
    const current = pickThemeConfig(useThemeStore.getState())

    if (stored) {
      serverThemeRef.current = pickThemeConfig(stored)
      writeOwner(userId)
      if (!sameTheme(stored, current)) {
        useThemeStore.getState().setTheme(stored)
      }
      return
    }

    // No server theme yet. Adopt the local one only if this browser's cache
    // belonged to this same account (or no account); otherwise start clean so
    // the previous user's look does not bleed through.
    const owner = readOwner()
    const belongedToOther = owner !== null && owner !== userId
    const seed = belongedToOther ? DEFAULT_THEME : current
    serverThemeRef.current = pickThemeConfig(seed)
    writeOwner(userId)
    if (!sameTheme(seed, current)) {
      useThemeStore.getState().setTheme(seed)
    }
    if (seededForRef.current !== userId) {
      seededForRef.current = userId
      saveRef.current.mutate({ theme: pickThemeConfig(seed) })
    }
  }, [isSuccess, userId, prefs?.theme])

  useEffect(() => {
    if (isDemoRuntime || !userId) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = useThemeStore.subscribe((state) => {
      const next = pickThemeConfig(state)
      if (serverThemeRef.current && sameTheme(next, serverThemeRef.current)) {
        return
      }
      clearTimeout(timer)
      timer = setTimeout(() => {
        serverThemeRef.current = next
        saveRef.current.mutate({ theme: next })
      }, 600)
    })
    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }, [userId])

  return null
}
