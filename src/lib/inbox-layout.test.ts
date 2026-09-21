import { describe, expect, it } from "vitest"
import { DEFAULT_INBOX_LAYOUT, resolveInboxLayout } from "./inbox-layout"

describe("resolveInboxLayout", () => {
  it("returns defaults for missing input", () => {
    expect(resolveInboxLayout()).toEqual(DEFAULT_INBOX_LAYOUT)
    expect(resolveInboxLayout(null)).toEqual(DEFAULT_INBOX_LAYOUT)
    expect(resolveInboxLayout({})).toEqual(DEFAULT_INBOX_LAYOUT)
  })

  it("accepts a fully valid layout", () => {
    expect(
      resolveInboxLayout({
        readingPane: "bottom",
        listDensity: "compact",
        showSnippets: false,
        rowStyle: "outlook",
        unreadStyle: "fill",
      })
    ).toEqual({
      readingPane: "bottom",
      listDensity: "compact",
      showSnippets: false,
      rowStyle: "outlook",
      unreadStyle: "fill",
    })
  })

  it("merges partial prefs over defaults", () => {
    expect(resolveInboxLayout({ listDensity: "cozy" })).toEqual({
      ...DEFAULT_INBOX_LAYOUT,
      listDensity: "cozy",
    })
    expect(resolveInboxLayout({ readingPane: "hidden" })).toEqual({
      ...DEFAULT_INBOX_LAYOUT,
      readingPane: "hidden",
    })
  })

  it("falls back for unknown reading pane values", () => {
    expect(resolveInboxLayout({ readingPane: "left" }).readingPane).toBe(
      DEFAULT_INBOX_LAYOUT.readingPane
    )
    expect(resolveInboxLayout({ readingPane: 42 }).readingPane).toBe(
      DEFAULT_INBOX_LAYOUT.readingPane
    )
  })

  it("falls back for unknown density values", () => {
    expect(resolveInboxLayout({ listDensity: "airy" }).listDensity).toBe(
      DEFAULT_INBOX_LAYOUT.listDensity
    )
    expect(resolveInboxLayout({ listDensity: null }).listDensity).toBe(
      DEFAULT_INBOX_LAYOUT.listDensity
    )
  })

  it("falls back for non-boolean snippet flags", () => {
    expect(resolveInboxLayout({ showSnippets: "yes" }).showSnippets).toBe(
      DEFAULT_INBOX_LAYOUT.showSnippets
    )
    expect(resolveInboxLayout({ showSnippets: false }).showSnippets).toBe(false)
  })

  it("falls back for unknown row styles", () => {
    expect(resolveInboxLayout({ rowStyle: "zimbra" }).rowStyle).toBe(
      DEFAULT_INBOX_LAYOUT.rowStyle
    )
    expect(resolveInboxLayout({ rowStyle: "gmail" }).rowStyle).toBe("gmail")
  })

  it("falls back for unknown unread styles", () => {
    expect(resolveInboxLayout({ unreadStyle: "glow" }).unreadStyle).toBe(
      DEFAULT_INBOX_LAYOUT.unreadStyle
    )
    expect(resolveInboxLayout({ unreadStyle: null }).unreadStyle).toBe(
      DEFAULT_INBOX_LAYOUT.unreadStyle
    )
    expect(resolveInboxLayout({ unreadStyle: "fill" }).unreadStyle).toBe("fill")
  })
})
