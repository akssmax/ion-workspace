import { describe, expect, it } from "vitest"
import { fileNodeSource } from "./file-source"
import { mailAttachmentSource } from "./mail-source"
import type { FileNode } from "@/jmap/types/files"

describe("mailAttachmentSource", () => {
  it("prefers blobId and loads lazily", async () => {
    const requested: string[] = []
    const source = mailAttachmentSource(
      { blobId: "b1", partId: "2", name: "a.pdf", type: "application/pdf", size: 12 },
      async (blobId) => {
        requested.push(blobId)
        return new Blob(["x"])
      }
    )
    expect(source.id).toBe("mail:b1")
    expect(source.mime).toBe("application/pdf")
    expect(requested).toEqual([])
    await source.loadBlob()
    expect(requested).toEqual(["b1"])
  })

  it("falls back to partId when blobId is absent", () => {
    const source = mailAttachmentSource(
      { partId: "3", name: "image.png", type: "image/png" },
      async () => new Blob()
    )
    expect(source.id).toBe("mail:3")
  })
})

describe("fileNodeSource", () => {
  function node(overrides: Partial<FileNode>): FileNode {
    return {
      id: "n1",
      name: "file",
      size: 1,
      isFile: true,
      contentType: "application/octet-stream",
      ...overrides,
    }
  }

  it("uses blobId when present", () => {
    const source = fileNodeSource(node({ blobId: "blob-9" }), async () => new Blob())
    expect(source.id).toBe("file:blob-9")
  })

  it("falls back to the node id", () => {
    const source = fileNodeSource(node({ blobId: null }), async () => new Blob())
    expect(source.id).toBe("file:n1")
  })
})
