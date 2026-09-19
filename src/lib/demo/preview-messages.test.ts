import { describe, expect, it } from "vitest"
import { isDemoSurface, isPreviewConfig } from "./preview-messages"

describe("embedded preview message validation", () => {
  it("accepts only workspace surfaces and monochrome theme modes", () => {
    for (const surface of ["mail", "calendar", "contacts", "files"]) {
      expect(isDemoSurface(surface)).toBe(true)
      expect(
        isPreviewConfig({ type: "ion:preview-config", surface, theme: "dark" })
      ).toBe(true)
    }
    expect(
      isPreviewConfig({
        type: "ion:preview-config",
        surface: "mail",
        theme: "light",
      })
    ).toBe(true)
  })
  it("rejects malformed or unrelated messages", () => {
    for (const value of [
      null,
      "mail",
      {},
      { type: "other", surface: "mail", theme: "dark" },
      { type: "ion:preview-config", surface: "settings", theme: "dark" },
      { type: "ion:preview-config", surface: "mail", theme: "system" },
    ]) {
      expect(isPreviewConfig(value)).toBe(false)
    }
  })
})
