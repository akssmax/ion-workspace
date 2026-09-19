/**
 * Workspace shell UI state (Zustand). UI-only preferences and navigation,
 * never domain data.
 */

import { create } from "zustand"

export type WorkspaceApp = "mail" | "calendar" | "contacts" | "files"

interface WorkspaceState {
  app: WorkspaceApp
  paletteOpen: boolean
  setApp: (app: WorkspaceApp) => void
  setPaletteOpen: (open: boolean) => void
}

// Navigation is session-local: fresh visits always start in Mail.
export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  app: "mail",
  paletteOpen: false,
  setApp: (app) => set({ app }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
}))
