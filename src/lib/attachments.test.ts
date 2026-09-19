import { afterEach, describe, expect, it, vi } from "vitest"
import {
  categoryFor,
  downloadBlob,
  fileIconFor,
  formatBytes,
} from "./attachments"

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(0)).toBe("0 B")
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(1024)).toBe("1.0 KB")
    expect(formatBytes(1536)).toBe("1.5 KB")
    expect(formatBytes(1024 * 1024 * 2.5)).toBe("2.5 MB")
    expect(formatBytes(1024 * 1024 * 1024 * 3.25)).toBe("3.3 GB")
  })
})

describe("fileIconFor", () => {
  it("maps known extensions to icon names", () => {
    expect(fileIconFor("report.pdf")).toBe("file-text")
    expect(fileIconFor("data.xlsx")).toBe("file-spreadsheet")
    expect(fileIconFor("pic.png")).toBe("file-image")
    expect(fileIconFor("archive.zip")).toBe("file-archive")
    expect(fileIconFor("clip.mp4")).toBe("file-video")
    expect(fileIconFor("song.mp3")).toBe("file-audio")
    expect(fileIconFor("package.json")).toBe("file-code")
  })

  it("is case-insensitive and falls back to file", () => {
    expect(fileIconFor("REPORT.PDF")).toBe("file-text")
    expect(fileIconFor("noidea.bin")).toBe("file")
  })
})

describe("categoryFor", () => {
  it("classifies mime types", () => {
    expect(categoryFor("image/png")).toBe("Image")
    expect(categoryFor("video/mp4")).toBe("Video")
    expect(categoryFor("audio/wav")).toBe("Audio")
    expect(categoryFor("application/pdf")).toBe("PDF")
    expect(categoryFor("application/zip")).toBe("Archive")
    expect(categoryFor("text/markdown")).toBe("Text")
    expect(categoryFor("application/octet-stream")).toBe("File")
  })
})

describe("downloadBlob", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("creates an object URL and clicks a temporary anchor", () => {
    const createObjectURL = vi.fn(() => "blob:mock")
    const revokeObjectURL = vi.fn()
    const click = vi.fn()
    const appendChild = vi.fn()
    const remove = vi.fn()

    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL })
    vi.stubGlobal("document", {
      createElement: () => ({ href: "", download: "", click, remove }),
      body: { appendChild },
    })
    vi.stubGlobal("window", {
      setTimeout: (fn: () => void) => {
        fn()
        return 0
      },
    })

    downloadBlob(new Blob(["hi"], { type: "text/plain" }), "hello.txt")

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(appendChild).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock")
  })
})
