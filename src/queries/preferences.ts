/**
 * User preference hooks. Layout prefs are stored server-side inside the
 * session (see `src/server/preferences.rpc.ts`) and cached here with
 * optimistic updates so the settings UI applies instantly.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getPreferences, savePreferences } from "../server/preferences.rpc"
import type { UserPreferences } from "../server/preferences.rpc"
import { resolveInboxLayout } from "../lib/inbox-layout"
import type { InboxLayoutPrefs } from "../lib/inbox-layout"
import { resolveNotificationPrefs } from "../lib/notifications"
import type { NotificationPreferences } from "../lib/notifications"
import { isDemoRuntime } from "@/lib/demo/runtime"

import { qk } from "./keys"
import { useSession } from "@/hooks/use-session"

let demoPreferences: UserPreferences = {}

export function usePreferences() {
  const { data: session } = useSession()
  const scope = `${session?.userId ?? "signed-out"}:${session?.accountId ?? "primary"}`
  return useQuery({
    queryKey: qk.preferences(scope),
    enabled: !!session || isDemoRuntime,
    queryFn: () =>
      isDemoRuntime ? Promise.resolve(demoPreferences) : getPreferences(),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })
}

/** Resolved inbox layout (server prefs merged over defaults). */
export function useInboxLayout(): InboxLayoutPrefs {
  const { data } = usePreferences()
  return resolveInboxLayout(data)
}

/** Resolved notification preferences (server prefs merged over defaults). */
export function useNotificationPrefs(): NotificationPreferences {
  const { data } = usePreferences()
  return resolveNotificationPrefs(data?.notifications)
}

/**
 * Persist an arbitrary partial preferences patch (feature flags, language,
 * …). Merges over the cached prefs so unrelated settings are preserved.
 * Same optimistic-update pattern as `useSaveInboxLayout`.
 */
export function useSavePreferences() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const key = qk.preferences(
    `${session?.userId ?? "signed-out"}:${session?.accountId ?? "primary"}`
  )
  return useMutation({
    mutationFn: async (patch: Partial<UserPreferences>) => {
      const current = queryClient.getQueryData<UserPreferences>(key) ?? {}
      const merged: UserPreferences = {
        ...current,
        ...patch,
        features: { ...current.features, ...patch.features },
      }
      const call = savePreferences as unknown as (input: {
        data: UserPreferences
      }) => Promise<{ ok: boolean }>
      if (isDemoRuntime) demoPreferences = merged
      else await call({ data: merged })
      return merged
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<UserPreferences>(key)
      const merged: UserPreferences = {
        ...previous,
        ...patch,
        features: { ...previous?.features, ...patch.features },
      }
      queryClient.setQueryData(key, merged)
      return { previous }
    },
    onError: (_error, _patch, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(key, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

/**
 * Persist a partial layout patch. Merges over the cached prefs so unrelated
 * settings (language, signatures, …) are preserved.
 */
export function useSaveInboxLayout() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const key = qk.preferences(
    `${session?.userId ?? "signed-out"}:${session?.accountId ?? "primary"}`
  )
  return useMutation({
    mutationFn: async (patch: Partial<InboxLayoutPrefs>) => {
      const current = queryClient.getQueryData<UserPreferences>(key) ?? {}
      const merged: UserPreferences = {
        ...current,
        ...resolveInboxLayout(current),
        ...patch,
      }
      const call = savePreferences as unknown as (input: {
        data: UserPreferences
      }) => Promise<{ ok: boolean }>
      if (isDemoRuntime) demoPreferences = merged
      else await call({ data: merged })
      return merged
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<UserPreferences>(key)
      const merged: UserPreferences = {
        ...previous,
        ...resolveInboxLayout(previous),
        ...patch,
      }
      queryClient.setQueryData(key, merged)
      return { previous }
    },
    onError: (_error, _patch, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(key, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
