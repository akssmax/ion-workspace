/**
 * Contribution points — the plug-in surface that lets feature modules extend
 * core UI without core knowing about them.
 *
 * A module registers contributions at import time, tagged with its feature
 * id. Core UI reads a point through `useContributions(point)`, which filters
 * out contributions from disabled features.
 */

import type { ComponentType } from "react"
import { useFeatureFlags } from "./flags"

export interface Contribution<T> {
  featureId: string
  value: T
}

export class ContributionPoint<T> {
  private readonly entries: Contribution<T>[] = []

  register(featureId: string, value: T): void {
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

// -- Points -----------------------------------------------------------------

/** Extra actions in the mail toolbar (next to archive/trash/…). */
export const mailToolbarActions =
  new ContributionPoint<ComponentContribution>()

/** Extra actions in the thread reading-pane header. */
export const threadActions = new ContributionPoint<ComponentContribution>()

/** Extra sections in the sidebar's secondary panel. */
export const sidebarSections = new ContributionPoint<ComponentContribution>()

/** Extra sections in the settings dialog. */
export const settingsSections = new ContributionPoint<ComponentContribution>()

/** Extra command-palette actions. */
export const paletteItems = new ContributionPoint<PaletteContribution>()

/** Extra keyboard shortcuts. */
export const featureShortcuts = new ContributionPoint<ShortcutContribution>()

// -- Consumption ------------------------------------------------------------

/** Contributions from enabled features only. */
export function useContributions<T>(point: ContributionPoint<T>): T[] {
  const flags = useFeatureFlags()
  return point
    .all()
    .filter((c) => flags[c.featureId] ?? false)
    .map((c) => c.value)
}
