import { lazy } from "react"
import type { ComponentType } from "react"

const RELOAD_KEY = "ion:chunk-reload"
const MAX_RELOADS = 2
const RESET_AFTER_MS = 5 * 60 * 1000

interface ReloadState {
  count: number
  ts: number
}

function readReloadState(): ReloadState {
  try {
    const raw = window.sessionStorage.getItem(RELOAD_KEY)
    if (!raw) return { count: 0, ts: 0 }
    const parsed = JSON.parse(raw) as ReloadState
    if (Date.now() - parsed.ts > RESET_AFTER_MS) return { count: 0, ts: 0 }
    return parsed
  } catch {
    return { count: 0, ts: 0 }
  }
}

/**
 * A new deployment replaces the hashed chunk files, so a tab loaded against the
 * previous build can fail to fetch a lazily imported module. Reload once (with a
 * small guard so a genuinely broken build cannot loop) to pick up the new assets.
 */
export function reloadForStaleChunk() {
  if (typeof window === "undefined") return
  const state = readReloadState()
  if (state.count >= MAX_RELOADS) return
  try {
    window.sessionStorage.setItem(
      RELOAD_KEY,
      JSON.stringify({ count: state.count + 1, ts: Date.now() })
    )
  } catch {
    return
  }
  window.location.reload()
}

/** `lazy` with a single retry, then a guarded reload for stale-deploy chunks. */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory()
    } catch {
      try {
        return await factory()
      } catch {
        reloadForStaleChunk()
        throw new Error("Failed to load module")
      }
    }
  })
}
