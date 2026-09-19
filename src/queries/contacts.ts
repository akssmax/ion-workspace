/**
 * Contacts React Query hooks.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as contactsService from "../services/contacts/contacts.service"
import { qk } from "./keys"
import type { JmapId } from "../jmap/types/contacts"

export function useAddressBooks() {
  return useQuery({
    queryKey: qk.addressBooks(),
    queryFn: () => contactsService.getAddressBooks(),
    staleTime: 60_000,
  })
}

export function useContacts(scope = "all") {
  return useQuery({
    queryKey: qk.contacts(scope),
    queryFn: () => contactsService.getAllContacts(),
    staleTime: 60_000,
  })
}

export function useAutocompleteContacts(text: string, enabled = true) {
  return useQuery({
    queryKey: qk.contacts(`autocomplete:${text}`),
    queryFn: () => contactsService.searchContacts(text, 10),
    enabled: enabled && text.trim().length > 0,
    staleTime: 30_000,
  })
}

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      contact: Parameters<typeof contactsService.createContact>[0]
    ) => contactsService.createContact(contact),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["acc", "contacts"] }),
  })
}

export function useUpdateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: JmapId
      patch: Parameters<typeof contactsService.updateContact>[1]
    }) => contactsService.updateContact(id, patch),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["acc", "contacts"] }),
  })
}

export function useDestroyContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: JmapId) => contactsService.destroyContact(id),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["acc", "contacts"] }),
  })
}
