/**
 * Contribution points — the plug-in surface that lets feature modules extend
 * core UI without core knowing about them.
 *
 * A module registers contributions at import time, tagged with its feature
 * id. Core UI reads a point through `useContributions(point)`, which filters
 * out contributions from disabled features.
 */

import { useMemo } from "react"
import type { ComponentType, ReactNode } from "react"
import { useFeatureFlags } from "./flags"

export interface Contribution<T> {
  featureId: string
  value: T
}

export class ContributionPoint<T> {
  private readonly entries: Contribution<T>[] = []

  register(featureId: string, value: T): void {
    // Idempotent for values carrying an `id`: HMR re-runs module registration
    // against this long-lived singleton, so replace instead of duplicating.
    const id = (value as { id?: string } | null)?.id
    if (id) {
      const index = this.entries.findIndex(
        (entry) =>
          entry.featureId === featureId &&
          (entry.value as { id?: string } | null)?.id === id
      )
      if (index !== -1) {
        this.entries[index] = { featureId, value }
        return
      }
    }
    this.entries.push({ featureId, value })
  }

  /** All registered contributions (unfiltered). */
  all(): Contribution<T>[] {
    return this.entries
  }
}

// -- Contribution value types ----------------------------------------------

/** A React component contribution (toolbar button, sidebar section, …). */
export type ComponentContribution = ComponentType<any>

/** Command-palette action contributed by a feature. */
export interface PaletteContribution {
  id: string
  title: string
  keywords?: string[]
  onSelect: () => void
}

/** Keyboard shortcut contributed by a feature. */
export interface ShortcutContribution {
  /** Human-readable keys, e.g. "z" or "shift+i". */
  keys: string
  description: string
  /** Returns false when the shortcut is not applicable right now. */
  when?: () => boolean
  run: () => void
}

/** A deep-linkable settings section contributed by a feature. */
export interface SettingsNavContribution {
  /** URL-safe id, used as `?section=<id>`. Must be unique. */
  id: string
  title: string
  description: string
  /** Nav group label; unknown groups sort after known ones. */
  group: string
  icon: ReactNode
  component: ComponentContribution
}

// -- Points -----------------------------------------------------------------

/** Extra actions in the mail toolbar (next to archive/trash/…). */
export const mailToolbarActions = new ContributionPoint<ComponentContribution>()

/** Extra actions in the thread reading-pane header. */
export const threadActions = new ContributionPoint<ComponentContribution>()

/** Extra sections in the sidebar's secondary panel. */
export const sidebarSections = new ContributionPoint<ComponentContribution>()

/** Extra sections in the settings dialog. */
export const settingsSections = new ContributionPoint<ComponentContribution>()

/** Extra deep-linkable sections in the settings nav. */
export const settingsNavSections =
  new ContributionPoint<SettingsNavContribution>()

/** Extra command-palette actions. */
export const paletteItems = new ContributionPoint<PaletteContribution>()

/** Extra keyboard shortcuts. */
export const featureShortcuts = new ContributionPoint<ShortcutContribution>()

// -- Consumption ------------------------------------------------------------

/** Contributions from enabled features only. */
export function useContributions<T>(point: ContributionPoint<T>): T[] {
  const flags = useFeatureFlags()
  return useMemo(
    () =>
      point
        .all()
        .filter((c) => flags[c.featureId] ?? false)
        .map((c) => c.value),
    [point, flags]
  )
}
