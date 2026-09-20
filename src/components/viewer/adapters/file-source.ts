/**
 * Adapt a Files node into a DocumentSource.
 *
 * FileNode blobs are addressable by `blobId` on Stalwart; the mock reuses the
 * node id, so fall back to it.
 */

import type { FileNode } from "@/jmap/types/files"
import type { DocumentSource } from "../types"

export function fileNodeSource(
  node: FileNode,
  loadBlob: (node: FileNode) => Promise<Blob>
): DocumentSource {
  return {
    id: `file:${node.blobId ?? node.id}`,
    name: node.name,
    mime: node.contentType || "application/octet-stream",
    size: node.size,
    loadBlob: () => loadBlob(node),
  }
}
