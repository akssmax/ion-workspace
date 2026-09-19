/**
 * User preference hooks. Layout prefs are stored server-side inside the
 * session (see `src/server/preferences.rpc.ts`) and cached here with
 * optimistic updates so the settings UI applies instantly.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getPreferences, savePreferences } from "../server/preferences.rpc"
import type { UserPreferences } from "../server/preferences.rpc"
import {
  resolveInboxLayout,
  type InboxLayoutPrefs,
} from "../lib/inbox-layout"
import { qk } from "./keys"

export function usePreferences() {
  return useQuery({
    queryKey: qk.preferences(),
    queryFn: () => getPreferences(),
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

/**
 * Persist an arbitrary partial preferences patch (feature flags, language,
 * …). Merges over the cached prefs so unrelated settings are preserved.
 * Same optimistic-update pattern as `useSaveInboxLayout`.
 */
export function useSavePreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<UserPreferences>) => {
      const current =
        queryClient.getQueryData<UserPreferences>(qk.preferences()) ?? {}
      const merged: UserPreferences = {
        ...current,
        ...patch,
        features: { ...current.features, ...patch.features },
      }
      const call = savePreferences as unknown as (input: {
        data: UserPreferences
      }) => Promise<{ ok: boolean }>
      await call({ data: merged })
      return merged
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: qk.preferences() })
      const previous =
        queryClient.getQueryData<UserPreferences>(qk.preferences())
      const merged: UserPreferences = {
        ...previous,
        ...patch,
        features: { ...previous?.features, ...patch.features },
      }
      queryClient.setQueryData(qk.preferences(), merged)
      return { previous }
    },
    onError: (_error, _patch, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(qk.preferences(), context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: qk.preferences() })
    },
  })
}

/**
 * Persist a partial layout patch. Merges over the cached prefs so unrelated
 * settings (language, signatures, …) are preserved.
 */
export function useSaveInboxLayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<InboxLayoutPrefs>) => {
      const current =
        queryClient.getQueryData<UserPreferences>(qk.preferences()) ?? {}
      const merged: UserPreferences = {
        ...current,
        ...resolveInboxLayout(current),
        ...patch,
      }
      const call = savePreferences as unknown as (input: {
        data: UserPreferences
      }) => Promise<{ ok: boolean }>
      await call({ data: merged })
      return merged
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: qk.preferences() })
      const previous =
        queryClient.getQueryData<UserPreferences>(qk.preferences())
      const merged: UserPreferences = {
        ...previous,
        ...resolveInboxLayout(previous),
        ...patch,
      }
      queryClient.setQueryData(qk.preferences(), merged)
      return { previous }
    },
    onError: (_error, _patch, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(qk.preferences(), context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: qk.preferences() })
    },
  })
}
