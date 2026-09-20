/**
 * JMAP FileNode namespace API (draft `urn:ietf:params:jmap:files`).
 */

import type { JmapClient } from "./JmapClient"
import type {
  FileNode,
  FileNodeGetResponse,
  FileNodeSetArgs,
  FileNodeSetResponse,
  JmapId,
} from "../types/files"

export class FilesApi {
  private _accountId: string | null = null

  constructor(private readonly client: JmapClient) {}

  get accountId(): string | null {
    return this._accountId
  }

  bindAccount(accountId: string): void {
    this._accountId = accountId
  }

  private acct(accountId?: string): string {
    return accountId ?? this._accountId ?? ""
  }

  private checkAccount(): void {
    if (!this._accountId)
      throw new Error("The JMAP files namespace is not bound to an account.")
  }

  /**
   * All nodes for the account. Stalwart's filenode draft has no reliable
   * parent filter, so we fetch the (flat) tree once and build folders
   * client-side from `parentId`.
   */
  async listAll(accountId?: string): Promise<FileNode[]> {
    this.checkAccount()
    const res = await this.client.call<FileNodeGetResponse>("FileNode/get", {
      accountId: this.acct(accountId),
    })
    return res.list.map(normalizeFileNode)
  }

  async listChildren(
    parentId: JmapId | null,
    accountId?: string
  ): Promise<FileNode[]> {
    const all = await this.listAll(accountId)
    return all.filter((node) => (node.parentId ?? null) === parentId)
  }

  async getByIds(ids: JmapId[], accountId?: string): Promise<FileNode[]> {
    const res = await this.client.call<FileNodeGetResponse>("FileNode/get", {
      accountId: this.acct(accountId),
      ids,
    })
    return res.list.map(normalizeFileNode)
  }

  async createFolder(
    name: string,
    parentId: JmapId | null,
    accountId?: string
  ): Promise<string> {
    const args: FileNodeSetArgs = {
      accountId: this.acct(accountId),
      create: {
        f0: {
          nodeType: "directory",
          name,
          parentId: parentId ?? null,
        },
      },
    }
    const res = await this.client.call<FileNodeSetResponse>(
      "FileNode/set",
      args,
      "fsc"
    )
    return Object.values(res.created ?? {})[0]?.id ?? ""
  }

  async createFile(input: {
    name: string
    contentType: string
    size: number
    blobId: string
    parentId?: JmapId | null
    accountId?: string
  }): Promise<string> {
    const args: FileNodeSetArgs = {
      accountId: this.acct(input.accountId),
      create: {
        f0: {
          nodeType: "file",
          name: input.name,
          parentId: input.parentId ?? null,
          blobId: input.blobId,
          size: input.size,
          type: input.contentType,
        },
      },
    }
    const res = await this.client.call<FileNodeSetResponse>(
      "FileNode/set",
      args,
      "fsf"
    )
    return Object.values(res.created ?? {})[0]?.id ?? ""
  }

  async rename(
    nodeId: JmapId,
    name: string,
    accountId?: string
  ): Promise<void> {
    const args: FileNodeSetArgs = {
      accountId: this.acct(accountId),
      update: { [nodeId]: { name } },
    }
    const res = await this.client.call<FileNodeSetResponse>(
      "FileNode/set",
      args,
      "fsrn"
    )
    const failure = res.notUpdated?.[nodeId]
    if (failure)
      throw new Error(
        failure.description ?? failure.type ?? "Could not rename this item."
      )
  }

  async move(
    nodeId: JmapId,
    parentId: JmapId | null,
    accountId?: string
  ): Promise<void> {
    const args: FileNodeSetArgs = {
      accountId: this.acct(accountId),
      update: { [nodeId]: { parentId: parentId ?? null } },
    }
    await this.client.call<FileNodeSetResponse>("FileNode/set", args, "fsmv")
  }

  async destroy(nodeId: JmapId, accountId?: string): Promise<void> {
    const args: FileNodeSetArgs = {
      accountId: this.acct(accountId),
      destroy: [nodeId],
    }
    const res = await this.client.call<FileNodeSetResponse>(
      "FileNode/set",
      args,
      "fsd"
    )
    const failure = res.notDestroyed?.[nodeId]
    if (failure)
      throw new Error(
        failure.description ??
          failure.type ??
          "Could not delete this item."
      )
  }
}

/**
 * Normalize a FileNode across servers. Stalwart's filenode draft reports
 * `nodeType` ("file" | "directory") instead of `isFile`, the MIME type as
 * `type`, and timestamps as `modified`/`changed`/`created`.
 */
function normalizeFileNode(node: FileNode): FileNode {
  const isFile =
    typeof node.isFile === "boolean"
      ? node.isFile
      : node.nodeType != null
        ? node.nodeType !== "directory"
        : false
  return {
    ...node,
    isFile,
    nodeType: node.nodeType ?? (isFile ? "file" : "directory"),
    contentType: node.contentType ?? node.type ?? "",
    modifiedAt:
      node.modifiedAt ?? node.modified ?? node.changed ?? node.created ?? null,
  }
}

export type { FileNode as FileNodeDto } from "../types/files"
