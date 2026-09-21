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
 * - On sign-in the server preference is applied once to seed the browser.
 * - After that the store is authoritative for this session; local changes are
 *   saved immediately. Stale preference refetches never overwrite the local
 *   theme, which previously caused a pick made near sign-out to revert.
 */
export function ThemeSync() {
  const session = useSession()
  const userId = session.data?.userId ?? null
  const { data: prefs, isSuccess } = usePreferences()
  const save = useSavePreferences()

  // The theme last known to be persisted server-side, used to ignore the echo
  // of our own writes and avoid a save loop.
  const serverThemeRef = useRef<ThemeConfig | null>(null)
  // The account whose initial server theme has already been applied.
  const initializedForRef = useRef<string | null>(null)
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
      initializedForRef.current = null
      seededForRef.current = null
      return
    }

    const stored = prefs.theme
    const current = pickThemeConfig(useThemeStore.getState())
    const isInitial = initializedForRef.current !== userId
    initializedForRef.current = userId

    if (stored) {
      if (isInitial) {
        serverThemeRef.current = pickThemeConfig(stored)
        writeOwner(userId)
        if (!sameTheme(stored, current)) {
          useThemeStore.getState().setTheme(stored)
        }
      } else if (sameTheme(stored, current)) {
        // Our own write echoing back; keep the guard reference current.
        serverThemeRef.current = pickThemeConfig(stored)
      }
      // A different value after init is a stale refetch — ignore it so it
      // cannot revert a selection the user just made.
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
    const unsubscribe = useThemeStore.subscribe((state) => {
      const next = pickThemeConfig(state)
      if (serverThemeRef.current && sameTheme(next, serverThemeRef.current)) {
        return
      }
      // Save immediately: a debounced write could be lost if the user signs
      // out before it fires, reverting the theme on their next sign-in.
      serverThemeRef.current = next
      saveRef.current.mutate({ theme: next })
    })
    return unsubscribe
  }, [userId])

  return null
}
