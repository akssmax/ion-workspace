/**
 * Workspace shell UI state (Zustand). UI-only preferences and navigation,
 * never domain data.
 */

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { workspaceStorage } from "@/lib/demo/runtime"

export type WorkspaceApp = "mail" | "calendar" | "contacts" | "files"

interface WorkspaceState {
  app: WorkspaceApp
  paletteOpen: boolean
  setApp: (app: WorkspaceApp) => void
  setPaletteOpen: (open: boolean) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      app: "mail",
      paletteOpen: false,
      setApp: (app) => set({ app }),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
    }),
    { name: "workspace-shell", storage: createJSONStorage(workspaceStorage) }
  )
)
