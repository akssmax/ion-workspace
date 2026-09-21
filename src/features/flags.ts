/**
 * Feature flags — per-user, backed by the server-side preferences store.
 *
 * Resolution order: explicit user override (prefs.features[id]) → registry
 * default. Writes are optimistic via `useSavePreferences`.
 */

import { useMemo } from "react"
import { usePreferences, useSavePreferences } from "@/queries/preferences"
import { getFeature, listFeatures } from "./registry"

/** Is a single feature enabled? Unknown ids resolve to false. */
export function useFeatureFlag(id: string): boolean {
  const { data } = usePreferences()
  const override = data?.features?.[id]
  if (typeof override === "boolean") return override
  return getFeature(id)?.defaultEnabled ?? false
}

/** All registered features with their resolved enabled state. */
export function useFeatureFlags(): Record<string, boolean> {
  const { data } = usePreferences()
  const features = data?.features
  return useMemo(() => {
    const out: Record<string, boolean> = {}
    for (const def of listFeatures()) {
      out[def.id] = features?.[def.id] ?? def.defaultEnabled
    }
    return out
  }, [features])
}

/** Toggle a feature flag (optimistic, persisted via preferences RPC). */
export function useSetFeatureFlag() {
  const { data } = usePreferences()
  const save = useSavePreferences()

  function setFlag(id: string, enabled: boolean) {
    return save.mutateAsync({
      features: { ...(data?.features ?? {}), [id]: enabled },
    })
  }

  return { setFlag, isSaving: save.isPending, isError: save.isError }
}
