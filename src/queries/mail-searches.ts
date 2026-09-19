import { isDemoRuntime } from "@/lib/demo/runtime"
import type { SavedMailSearch } from "@/server/mail-searches.rpc"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  listSavedMailSearches,
  saveMailSearch,
  deleteMailSearch,
} from "@/server/mail-searches.rpc"
import { useSession } from "@/hooks/use-session"

let demoSearches: SavedMailSearch[] = []

export function useSavedMailSearches(enabled: boolean) {
  const { data: session } = useSession()
  const scope = session?.accountId ?? session?.userId ?? "signed-out"
  return useQuery({
    queryKey: ["mail-metadata", "saved-searches", scope],
    queryFn: () =>
      isDemoRuntime
        ? Promise.resolve([...demoSearches])
        : listSavedMailSearches(),
    enabled,
  })
}

export function useSaveMailSearch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; query: string }) => {
      if (isDemoRuntime) {
        const id = crypto.randomUUID()
        demoSearches = [...demoSearches, { ...data, id }]
        return Promise.resolve({ id })
      }
      return (
        saveMailSearch as unknown as (input: {
          data: typeof data
        }) => Promise<{ id: string }>
      )({ data })
    },
    onSuccess: () =>
      void qc.invalidateQueries({
        queryKey: ["mail-metadata", "saved-searches"],
      }),
  })
}

export function useDeleteMailSearch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => {
      if (isDemoRuntime) {
        demoSearches = demoSearches.filter((s) => s.id !== id)
        return Promise.resolve({ ok: true })
      }
      return (
        deleteMailSearch as unknown as (input: {
          data: { id: string }
        }) => Promise<{ ok: boolean }>
      )({ data: { id } })
    },
    onSuccess: () =>
      void qc.invalidateQueries({
        queryKey: ["mail-metadata", "saved-searches"],
      }),
  })
}
