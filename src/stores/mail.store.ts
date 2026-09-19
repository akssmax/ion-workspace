/**
 * Mail UI navigation state (Zustand). Which mailbox we're in, the focused
 * thread, and the current search text. Domain data lives in React Query.
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type MailPaneView = "list+reading" | "list" | "reading"

interface MailState {
  activeMailboxId: string | null
  focusedThreadId: string | null
  selectedThreadIds: string[]
  /** Thread ids currently rendered by the list (for select-all). */
  visibleThreadIds: string[]
  searchQuery: string
  paneView: MailPaneView
  setActiveMailbox: (id: string | null) => void
  setFocusedThread: (id: string | null) => void
  toggleThreadSelection: (id: string) => void
  /** Shift-click: add the visible range between anchor and target to the selection. */
  selectRange: (anchorId: string, targetId: string) => void
  selectThreads: (ids: string[]) => void
  clearSelection: () => void
  setVisibleThreadIds: (ids: string[]) => void
  setSearchQuery: (query: string) => void
  setPaneView: (view: MailPaneView) => void
}

function initial() {
  return {
    activeMailboxId: null,
    focusedThreadId: null,
    selectedThreadIds: [],
    visibleThreadIds: [],
    searchQuery: "",
    paneView: "list+reading" as MailPaneView,
  }
}

export const useMailStore = create<MailState>()(
  persist(
    (set) => ({
      ...initial(),
      setActiveMailbox: (id) =>
        set((s) =>
          id === s.activeMailboxId
            ? s
            : {
                activeMailboxId: id,
                focusedThreadId: null,
                selectedThreadIds: [],
                searchQuery: "",
              }
        ),
      setFocusedThread: (id) =>
        set(() => ({ focusedThreadId: id, selectedThreadIds: [] })),
      toggleThreadSelection: (id) =>
        set((s) => ({
          selectedThreadIds: s.selectedThreadIds.includes(id)
            ? s.selectedThreadIds.filter((x) => x !== id)
            : [...s.selectedThreadIds, id],
        })),
      selectRange: (anchorId, targetId) =>
        set((s) => {
          const ids = s.visibleThreadIds
          const a = ids.indexOf(anchorId)
          const b = ids.indexOf(targetId)
          if (a === -1 || b === -1) {
            return {
              selectedThreadIds: s.selectedThreadIds.includes(targetId)
                ? s.selectedThreadIds
                : [...s.selectedThreadIds, targetId],
            }
          }
          const range = ids.slice(Math.min(a, b), Math.max(a, b) + 1)
          return {
            selectedThreadIds: [...new Set([...s.selectedThreadIds, ...range])],
          }
        }),
      selectThreads: (ids) => set({ selectedThreadIds: ids }),
      clearSelection: () =>
        set({ selectedThreadIds: [], focusedThreadId: null }),
      setVisibleThreadIds: (ids) =>
        set((s) =>
          // Avoid render loops: only update when the list actually changed.
          s.visibleThreadIds.length === ids.length &&
          s.visibleThreadIds.every((id, i) => id === ids[i])
            ? s
            : { visibleThreadIds: ids }
        ),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setPaneView: (paneView) => set({ paneView }),
    }),
    {
      name: "workspace-mail",
      partialize: (s) => ({
        activeMailboxId: s.activeMailboxId,
        paneView: s.paneView,
      }),
    }
  )
)
