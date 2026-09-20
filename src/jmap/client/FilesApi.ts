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

  async listChildren(
    parentId: JmapId | null,
    accountId?: string
  ): Promise<FileNode[]> {
    this.checkAccount()
    const acc = this.acct(accountId)
    const res = await this.client.call<{ list: FileNode[] }>("FileNode/get", {
      accountId: acc,
      ...(parentId ? { ids: [parentId] } : {}),
      properties: [
        "isFile",
        "nodeType",
        "name",
        "size",
        "contentType",
        "blobId",
        "parentId",
        "childNodeIds",
        "modifiedAt",
      ],
    })
    return res.list.map(normalizeFileNode)
  }

  async getByIds(ids: JmapId[], accountId?: string): Promise<FileNode[]> {
    const res = await this.client.call<FileNodeGetResponse>("FileNode/get", {
      accountId: this.acct(accountId),
      ids,
      properties: [
        "isFile",
        "nodeType",
        "name",
        "size",
        "contentType",
        "blobId",
        "parentId",
        "childNodeIds",
        "modifiedAt",
      ],
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
          name,
          isFile: false,
          contentType: "application/octet-stream",
          size: 0,
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
          name: input.name,
          contentType: input.contentType,
          size: input.size,
          blobId: input.blobId,
          isFile: true,
          parentId: input.parentId ?? null,
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
    await this.client.call<FileNodeSetResponse>("FileNode/set", args, "fsrn")
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
    await this.client.call<FileNodeSetResponse>("FileNode/set", args, "fsd")
  }
}

/**
 * Normalize a FileNode across servers: Stalwart's filenode draft reports
 * `nodeType` ("file" | "directory") instead of `isFile`, and may omit
 * `contentType` for files (the viewer then routes by extension).
 */
function normalizeFileNode(node: FileNode): FileNode {
  const isFile =
    typeof node.isFile === "boolean"
      ? node.isFile
      : node.nodeType != null
        ? node.nodeType !== "directory"
        : false
  return { ...node, isFile, contentType: node.contentType ?? "" }
}

export type { FileNode as FileNodeDto } from "../types/files"
