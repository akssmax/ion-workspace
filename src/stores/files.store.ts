/**
 * Files UI state (Zustand): breadcrumb navigation over the file tree.
 */

import { create } from "zustand"

interface FilesState {
  path: { id: string | null; name: string }[]
  navigateTo: (node: { id: string | null; name: string }) => void
  getId: () => string | null
  reset: () => void
}

export const useFilesStore = create<FilesState>((set, get) => ({
  path: [{ id: null, name: "My Files" }],
  navigateTo: (node) => {
    const { path } = get()
    const idx = path.findIndex((p) => p.id === node.id)
    if (node.id === null) {
      set({ path: [{ id: null, name: node.name }] })
      return
    }
    if (idx >= 0) set({ path: path.slice(0, idx + 1) })
    else set({ path: [...path, node] })
  },
  getId: () => get().path[get().path.length - 1]?.id ?? null,
  reset: () => set({ path: [{ id: null, name: "My Files" }] }),
}))
