/**
 * Files browser sorting/filtering. Pure helpers so the view stays presentational
 * and the rules are unit-tested.
 */

import type { FileNode } from "@/jmap/types/files"
import { kindForMime } from "@/components/viewer"

export type FileSortKey = "name" | "size" | "type" | "modified"
export type FileFilterKey =
  | "all"
  | "folders"
  | "files"
  | "images"
  | "pdfs"
  | "documents"
  | "media"

export function nodeKind(node: FileNode) {
  return kindForMime(node.contentType ?? "", node.name)
}

export function matchesFileFilter(
  node: FileNode,
  filter: FileFilterKey
): boolean {
  switch (filter) {
    case "all":
      return true
    case "folders":
      return !node.isFile
    case "files":
      return node.isFile
    case "images":
      return nodeKind(node) === "image"
    case "pdfs":
      return nodeKind(node) === "pdf"
    case "documents": {
      const kind = nodeKind(node)
      return kind === "docx" || kind === "sheet" || kind === "text"
    }
    case "media":
      return nodeKind(node) === "media"
  }
}

export function compareFileNodes(
  a: FileNode,
  b: FileNode,
  sort: FileSortKey,
  direction: "asc" | "desc"
): number {
  // Folders always lead, then the chosen sort inside each group.
  const group = Number(a.isFile) - Number(b.isFile)
  if (group !== 0) return group
  let result = 0
  switch (sort) {
    case "size":
      result = (a.size ?? 0) - (b.size ?? 0)
      break
    case "type":
      result =
        nodeKind(a).localeCompare(nodeKind(b)) || a.name.localeCompare(b.name)
      break
    case "modified":
      result =
        new Date(a.modifiedAt ?? 0).getTime() -
        new Date(b.modifiedAt ?? 0).getTime()
      break
    default:
      result = a.name.localeCompare(b.name)
  }
  return direction === "asc" ? result : -result
}

export function filterAndSortFiles(
  nodes: FileNode[],
  options: {
    filter: FileFilterKey
    search: string
    sort: FileSortKey
    direction: "asc" | "desc"
  }
): FileNode[] {
  const needle = options.search.trim().toLowerCase()
  return nodes
    .filter((node) => matchesFileFilter(node, options.filter))
    .filter((node) => !needle || node.name.toLowerCase().includes(needle))
    .sort((a, b) => compareFileNodes(a, b, options.sort, options.direction))
}
