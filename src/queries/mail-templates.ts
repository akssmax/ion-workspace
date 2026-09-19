import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  templatesAvailable,
  listMailTemplates,
  saveMailTemplate,
  deleteMailTemplate,
} from "@/server/mail-templates.rpc"
import { isDemoRuntime } from "@/lib/demo/runtime"

type Template = Awaited<ReturnType<typeof listMailTemplates>>[number]
let demoTemplates: Template[] = []
export function useMailTemplates() {
  const availability = useQuery({
    queryKey: ["mail-metadata", "available"],
    queryFn: () =>
      isDemoRuntime ? Promise.resolve(true) : templatesAvailable(),
    staleTime: 60_000,
  })
  const templates = useQuery({
    queryKey: ["mail-metadata", "templates"],
    queryFn: () =>
      isDemoRuntime ? Promise.resolve([...demoTemplates]) : listMailTemplates(),
    enabled: availability.data === true,
  })
  return {
    available: availability.data === true,
    templates: templates.data ?? [],
  }
}
export function useSaveMailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      id?: string
      name: string
      subject: string
      htmlBody: string
    }) => {
      if (isDemoRuntime) {
        const id = data.id ?? crypto.randomUUID()
        if (data.id) {
          demoTemplates = demoTemplates.map((template) => template.id === id ? { ...template, ...data } : template)
        } else {
          demoTemplates = [...demoTemplates, { ...data, id, createdAt: new Date().toISOString() }]
        }
        return { id }
      }
      return (
        saveMailTemplate as unknown as (arg: {
          data: typeof data
        }) => Promise<{ id: string }>
      )({ data })
    },
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["mail-metadata", "templates"] }),
  })
}
export function useDeleteMailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemoRuntime) {
        demoTemplates = demoTemplates.filter((t) => t.id !== id)
        return { ok: true }
      }
      return (
        deleteMailTemplate as unknown as (arg: {
          data: { id: string }
        }) => Promise<{ ok: boolean }>
      )({ data: { id } })
    },
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["mail-metadata", "templates"] }),
  })
}
