import { describe, expect, it } from "vitest"
import { LANGUAGES, languageDirection, normalizeLanguage, translate } from "./language"

describe("workspace languages", () => {
  it("gives each selectable language a translated settings and mail label", () => {
    for (const item of LANGUAGES) {
      expect(translate(item.value, "Settings")).toBeTruthy()
      expect(translate(item.value, "Inbox")).toBeTruthy()
      if (item.value !== "en") expect(translate(item.value, "Settings")).not.toBe("Settings")
    }
  })

  it("uses RTL for Arabic and safely falls back for unknown saved values", () => {
    expect(languageDirection("ar")).toBe("rtl")
    expect(languageDirection("hi")).toBe("ltr")
    expect(normalizeLanguage("unsupported")).toBe("en")
  })
})
