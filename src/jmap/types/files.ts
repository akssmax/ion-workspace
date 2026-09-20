/**
 * JMAP FileNode types (draft `urn:ietf:params:jmap:files`) and method args.
 *
 * Stalwart exposes file-node functionality through its `urn:ietf:params:jmap:files`
 * draft capability. Where a server does not advertise the capability the file
 * service falls back to blob upload/download through the core capability.
 */

import type { JmapId } from "./mail"

export type { JmapId } from "./mail"

export interface FileNode {
  id: JmapId
  size: number
  /** Normalized MIME type (Stalwart returns it as `type`). */
  contentType?: string
  name: string
  isFile: boolean
  /** Stalwart/draft servers express the kind as `nodeType` instead of `isFile`. */
  nodeType?: "file" | "directory" | string | null
  blobId?: string | null
  parentId?: JmapId | null
  childNodeIds?: JmapId[] | null
  /** Normalized modified timestamp (Stalwart returns `modified`/`changed`). */
  modifiedAt?: string | null
  /** Raw server fields, normalized into the properties above. */
  type?: string | null
  modified?: string | null
  changed?: string | null
  created?: string | null
  role?: string | null
}

export interface FileTree {
  id: JmapId
  modifiedAt?: string | null
  byFileId?: Record<JmapId, { position: number; parentId?: JmapId | null }>
  byFilePath?: Record<string, JmapId>
}

export interface FileNodeGetArgs {
  accountId: JmapId
  ids?: JmapId[] | null
  properties?: string[]
}

export interface FileNodeGetResponse {
  accountId: JmapId
  state: string
  list: FileNode[]
  notFound: JmapId[]
}

export interface FileNodeSetArgs {
  accountId: JmapId
  ifInState?: string
  create?: Record<string, Partial<FileNode>>
  update?: Record<string, Partial<Record<string, unknown>>>
  destroy?: JmapId[]
}

export interface FileNodeSetResponse {
  accountId: JmapId
  oldState: string
  newState: string
  created?: Record<string, Partial<FileNode>>
  updated?: Record<string, Partial<FileNode> | null>
  destroyed?: JmapId[]
  notCreated?: Record<string, { type: string; description?: string }>
  notUpdated?: Record<string, { type: string; description?: string }>
  notDestroyed?: Record<string, { type: string; description?: string }>
}
