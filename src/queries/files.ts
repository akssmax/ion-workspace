/**
 * Files React Query hooks.
 *
 * The filenode draft has no reliable parent filter, so we fetch the flat tree
 * once and derive a folder's children client-side. This keeps navigation,
 * sorting, filtering and pagination instant.
 */

import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as filesService from "../services/files/files.service"
import { qk } from "./keys"
import type { JmapId } from "../jmap/types/files"

/** All file/folder nodes for the account (flat, with `parentId`). */
export function useFileNodes() {
  return useQuery({
    queryKey: qk.files("all"),
    queryFn: () => filesService.listAllFiles(),
    staleTime: 60_000,
  })
}

/** Children of a folder, derived from the flat tree. */
export function useFiles(parentId: string | null = null) {
  const query = useFileNodes()
  const data = useMemo(
    () =>
      (query.data ?? []).filter(
        (node) => (node.parentId ?? null) === parentId
      ),
    [query.data, parentId]
  )
  return { ...query, data }
}

/** Total node count (for breadcrumb/stats). */
export function useFileCount(): number {
  const { data } = useFileNodes()
  return data?.length ?? 0
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["acc", "files"] })
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
    onSuccess: () => invalidate(qc),
  })
}

export function useUploadFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, parentId }: { file: File; parentId: string | null }) =>
      filesService.uploadFile(file, parentId),
    onSuccess: () => invalidate(qc),
  })
}

export function useRenameNode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: JmapId; name: string }) =>
      filesService.renameNode(id, name),
    onSuccess: () => invalidate(qc),
  })
}

export function useDeleteNode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: JmapId) => filesService.deleteNode(id),
    onSuccess: () => invalidate(qc),
  })
}

export function useDownloadFileNode() {
  return useMutation({
    mutationFn: (node: Parameters<typeof filesService.downloadFileNode>[0]) =>
      filesService.downloadFileNode(node),
  })
}
