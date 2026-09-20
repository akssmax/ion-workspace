/**
 * Files domain service (JMAP FileNode / blob endpoint).
 */

import type { FileNode, JmapId } from "../../jmap/types/files"
import { JMAP_CAPS } from "../../jmap/types"
import { getJmapClient, getPrimaryAccountId } from "../jmap.service"

export async function listFiles(
  parentId: JmapId | null = null
): Promise<FileNode[]> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId(JMAP_CAPS.FILES)
  if (!accountId) return []
  client.files.bindAccount(accountId)
  return client.files.listChildren(parentId, accountId)
}

export async function createFolder(
  name: string,
  parentId: JmapId | null = null
): Promise<string> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId(JMAP_CAPS.FILES)
  if (!accountId) throw new Error("No files account available.")
  client.files.bindAccount(accountId)
  return client.files.createFolder(name, parentId, accountId)
}

export async function uploadFile(
  file: File,
  parentId: JmapId | null = null
): Promise<string> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId(JMAP_CAPS.FILES)
  if (!accountId) throw new Error("No files account available.")
  client.files.bindAccount(accountId)
  const content = await file.arrayBuffer()
  const uploaded = await client.upload(accountId, content, {
    contentType: file.type || "application/octet-stream",
    filename: file.name,
  })
  return client.files.createFile({
    name: file.name,
    contentType: uploaded.type,
    size: uploaded.size,
    blobId: uploaded.blobId,
    parentId,
    accountId,
  })
}

export async function renameNode(nodeId: JmapId, name: string): Promise<void> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId(JMAP_CAPS.FILES)
  if (!accountId) return
  client.files.bindAccount(accountId)
  await client.files.rename(nodeId, name, accountId)
}

export async function deleteNode(nodeId: JmapId): Promise<void> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId(JMAP_CAPS.FILES)
  if (!accountId) return
  client.files.bindAccount(accountId)
  await client.files.destroy(nodeId, accountId)
}

export async function downloadFileNode(node: FileNode): Promise<Blob> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId(JMAP_CAPS.FILES)
  if (!accountId) throw new Error("No files account available.")
  return client.download(accountId, node.blobId ?? node.id)
}

/** Load a file node's bytes as a Blob (used by the document preview). */
export async function loadFileBlob(node: FileNode): Promise<Blob> {
  return downloadFileNode(node)
}
