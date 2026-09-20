import { describe, expect, it } from "vitest"
import type { FileNode } from "@/jmap/types/files"
import {
  compareFileNodes,
  filterAndSortFiles,
  matchesFileFilter,
} from "./file-browser"

function node(overrides: Partial<FileNode>): FileNode {
  return {
    id: overrides.id ?? "n",
    name: overrides.name ?? "file",
    size: overrides.size ?? 0,
    isFile: overrides.isFile ?? true,
    contentType: overrides.contentType ?? "",
    ...overrides,
  }
}

const folder = node({ id: "f1", name: "Zeta", isFile: false })
const pdf = node({ id: "p1", name: "b.pdf", contentType: "application/pdf", size: 200 })
const image = node({ id: "i1", name: "a.png", contentType: "image/png", size: 100 })
const sheet = node({ id: "s1", name: "c.xlsx", contentType: "", size: 300 })
const video = node({ id: "v1", name: "d.mp4", contentType: "video/mp4", size: 400 })

const all = [folder, pdf, image, sheet, video]

describe("matchesFileFilter", () => {
  it("filters by kind", () => {
    expect(matchesFileFilter(folder, "folders")).toBe(true)
    expect(matchesFileFilter(pdf, "files")).toBe(true)
    expect(matchesFileFilter(image, "images")).toBe(true)
    expect(matchesFileFilter(pdf, "pdfs")).toBe(true)
    expect(matchesFileFilter(sheet, "documents")).toBe(true)
    expect(matchesFileFilter(video, "media")).toBe(true)
    expect(matchesFileFilter(image, "documents")).toBe(false)
  })
})

describe("compareFileNodes", () => {
  it("always puts folders first", () => {
    const sorted = [...all].sort((a, b) => compareFileNodes(a, b, "name", "asc"))
    expect(sorted[0].id).toBe("f1")
  })

  it("sorts by size within groups", () => {
    const sorted = [...all].sort((a, b) =>
      compareFileNodes(a, b, "size", "asc")
    )
    expect(sorted.slice(1).map((n) => n.id)).toEqual(["i1", "p1", "s1", "v1"])
  })
})

describe("filterAndSortFiles", () => {
  it("filters, searches and sorts together", () => {
    const result = filterAndSortFiles(all, {
      filter: "files",
      search: "",
      sort: "name",
      direction: "asc",
    })
    expect(result.map((n) => n.name)).toEqual([
      "a.png",
      "b.pdf",
      "c.xlsx",
      "d.mp4",
    ])
  })

  it("searches by name case-insensitively", () => {
    const result = filterAndSortFiles(all, {
      filter: "all",
      search: "PDF",
      sort: "name",
      direction: "asc",
    })
    expect(result.map((n) => n.id)).toEqual(["p1"])
  })
})
