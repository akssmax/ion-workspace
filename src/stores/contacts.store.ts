/**
 * Contacts UI state (Zustand).
 */

import { create } from "zustand"

interface ContactsState {
  activeBookId: string | null
  selectedContactIds: string[]
  setActiveBook: (id: string | null) => void
  toggleContact: (id: string) => void
}

export const useContactsStore = create<ContactsState>((set) => ({
  activeBookId: null,
  selectedContactIds: [],
  setActiveBook: (activeBookId) =>
    set({ activeBookId, selectedContactIds: [] }),
  toggleContact: (id) =>
    set((s) => ({
      selectedContactIds: s.selectedContactIds.includes(id)
        ? s.selectedContactIds.filter((x) => x !== id)
        : [...s.selectedContactIds, id],
    })),
}))
