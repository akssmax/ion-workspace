/**
 * Files React Query hooks.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as filesService from "../services/files/files.service"
import { qk } from "./keys"
import type { JmapId } from "../jmap/types/files"

export function useFiles(parentId: string | null = null) {
  return useQuery({
    queryKey: qk.files(parentId),
    queryFn: () => filesService.listFiles(parentId),
    staleTime: 60_000,
  })
}

export function useCreateFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      name,
      parentId,
    }: {
      name: string
      parentId: string | null
    }) => filesService.createFolder(name, parentId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["acc", "files"] }),
  })
}

export function useUploadFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, parentId }: { file: File; parentId: string | null }) =>
      filesService.uploadFile(file, parentId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["acc", "files"] }),
  })
}

export function useRenameNode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: JmapId; name: string }) =>
      filesService.renameNode(id, name),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["acc", "files"] }),
  })
}

export function useDeleteNode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: JmapId) => filesService.deleteNode(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["acc", "files"] }),
  })
}

export function useDownloadFileNode() {
  return useMutation({
    mutationFn: (node: Parameters<typeof filesService.downloadFileNode>[0]) =>
      filesService.downloadFileNode(node),
  })
}
