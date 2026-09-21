/**
 * Feature registry.
 *
 * Every non-core capability of the workspace is a "feature": a self-contained
 * module under `src/modules/**` that registers itself here at import time.
 * Features can be enabled/disabled per user via feature flags (see
 * `flags.ts`), persisted in the server-side preferences store.
 *
 * Core mail (inbox, threads, compose, send, read/unread, star, archive,
 * trash, search, shell) is NOT a feature — it is always on.
 */

export type FeatureApp = "mail" | "calendar" | "contacts" | "files" | "system"

export interface FeatureDefinition {
  /** Stable id, e.g. "mail.labels". Used as the flag key in preferences. */
  id: string
  title: string
  description: string
  /** Default when the user has never toggled the feature. */
  defaultEnabled: boolean
  /** Which apps the feature surfaces in (informational / settings grouping). */
  apps: FeatureApp[]
  /** Other feature ids that must be enabled for this one to work. */
  requires?: string[]
}

const registry = new Map<string, FeatureDefinition>()

/**
 * Register a feature. Called by feature modules at import time.
 *
 * Idempotent: the registry is a module singleton that outlives Vite HMR
 * re-evaluations, so re-registering the same id returns the existing entry
 * instead of throwing during development.
 */
export function defineFeature(def: FeatureDefinition): FeatureDefinition {
  const existing = registry.get(def.id)
  if (existing) return existing
  registry.set(def.id, def)
  return def
}

export function getFeature(id: string): FeatureDefinition | undefined {
  return registry.get(id)
}

export function listFeatures(): FeatureDefinition[] {
  return [...registry.values()].sort((a, b) => a.id.localeCompare(b.id))
}
