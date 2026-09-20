import { describe, expect, it } from "vitest"
import {
  extensionOf,
  isPreviewable,
  kindForMime,
  languageFor,
} from "./document-kind"
import { MAX_PREVIEW_BYTES } from "./types"

describe("kindForMime", () => {
  it("routes by mime type", () => {
    expect(kindForMime("image/png")).toBe("image")
    expect(kindForMime("application/pdf")).toBe("pdf")
    expect(kindForMime("text/plain")).toBe("text")
    expect(kindForMime("audio/mpeg")).toBe("media")
    expect(kindForMime("video/mp4")).toBe("media")
  })

  it("falls back to the extension for generic mime types", () => {
    expect(kindForMime("application/octet-stream", "photo.JPG")).toBe("image")
    expect(kindForMime("", "report.docx")).toBe("docx")
    expect(kindForMime("", "sheet.xlsx")).toBe("sheet")
  })

  it("routes html to text so markup is never executed", () => {
    expect(kindForMime("text/html", "page.html")).toBe("text")
  })

  it("treats csv and legacy office as sheet/unsupported", () => {
    expect(kindForMime("text/csv")).toBe("sheet")
    expect(kindForMime("application/msword", "old.doc")).toBe("unsupported")
    expect(kindForMime("application/zip", "a.zip")).toBe("unsupported")
  })
})

describe("isPreviewable", () => {
  it("rejects files above the size cap", () => {
    expect(isPreviewable("image/png", "x.png", MAX_PREVIEW_BYTES + 1)).toBe(false)
    expect(isPreviewable("image/png", "x.png", 1024)).toBe(true)
  })

  it("rejects unsupported kinds", () => {
    expect(isPreviewable("application/zip", "a.zip")).toBe(false)
  })
})

describe("languageFor", () => {
  it("maps known extensions to shiki languages", () => {
    expect(languageFor("a.json")).toBe("json")
    expect(languageFor("a.tsx")).toBe("tsx")
    expect(languageFor("a.unknown")).toBeUndefined()
  })
})

describe("extensionOf", () => {
  it("reads the extension case-insensitively", () => {
    expect(extensionOf("A.PDF")).toBe("pdf")
    expect(extensionOf("noext")).toBe("")
  })
})
