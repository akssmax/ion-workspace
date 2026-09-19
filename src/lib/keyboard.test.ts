import { describe, expect, it } from "vitest"
import {
  describeShortcut,
  lookupShortcut,
  SHORTCUTS,
  shortcutMatches,
} from "./keyboard"

function keyEvent(
  key: string,
  mods: { meta?: boolean; ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
): KeyboardEvent {
  return {
    key,
    metaKey: mods.meta ?? false,
    ctrlKey: mods.ctrl ?? false,
    shiftKey: mods.shift ?? false,
    altKey: mods.alt ?? false,
  } as KeyboardEvent
}

describe("SHORTCUTS", () => {
  it("exposes the expected mail shortcuts", () => {
    const ids = SHORTCUTS.map((s) => s.id)
    for (const id of [
      "compose",
      "search",
      "refresh",
      "mark-read",
      "archive",
      "reply",
    ]) {
      expect(ids).toContain(id)
    }
  })

  it("registers the refresh shortcut as ctrl+r / cmd+r", () => {
    const refresh = lookupShortcut("refresh")
    expect(refresh?.keys).toBe("ctrl+r")
    expect(refresh?.macKeys).toBe("cmd+r")
  })
})

describe("lookupShortcut", () => {
  it("finds registered shortcuts by id", () => {
    expect(lookupShortcut("reply")?.keys).toBe("r")
    expect(lookupShortcut("nope")).toBeUndefined()
  })
})

describe("shortcutMatches", () => {
  it("matches 'c' with no modifiers", () => {
    expect(shortcutMatches(keyEvent("c"), "c")).toBe(true)
    expect(shortcutMatches(keyEvent("c", { meta: true }), "c")).toBe(false)
  })

  it("accepts either cmd or ctrl for cmd/ctrl shortcuts", () => {
    expect(shortcutMatches(keyEvent("k", { meta: true }), "cmd+k")).toBe(true)
    expect(shortcutMatches(keyEvent("k", { ctrl: true }), "cmd+k")).toBe(true)
    expect(shortcutMatches(keyEvent("k"), "cmd+k")).toBe(false)
  })

  it("matches shift-chords exactly", () => {
    expect(shortcutMatches(keyEvent("i", { shift: true }), "shift+i")).toBe(
      true
    )
    expect(shortcutMatches(keyEvent("i"), "shift+i")).toBe(false)
  })

  it("matches the refresh chord on both platforms", () => {
    expect(shortcutMatches(keyEvent("r", { ctrl: true }), "ctrl+r")).toBe(true)
    expect(shortcutMatches(keyEvent("r", { meta: true }), "cmd+r")).toBe(true)
  })

  it("rejects a different main key with the right modifier", () => {
    expect(shortcutMatches(keyEvent("o", { ctrl: true }), "ctrl+r")).toBe(false)
  })

  it("is case-insensitive for the main key", () => {
    expect(shortcutMatches(keyEvent("R", { ctrl: true }), "ctrl+r")).toBe(true)
  })
})

describe("describeShortcut", () => {
  it("renders readable key labels", () => {
    expect(describeShortcut("reply")).toBe("R")
    expect(describeShortcut("mark-read")).toBe("⇧ I")
    expect(describeShortcut("send")).toContain("⏎")
  })

  it("returns an empty string for unknown ids", () => {
    expect(describeShortcut("nope")).toBe("")
  })
})
