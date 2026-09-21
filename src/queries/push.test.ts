import { describe, expect, it } from "vitest"
import { normalizePushEvent } from "./push"

describe("normalizePushEvent", () => {
  it("routes mock push payloads by type", () => {
    expect(normalizePushEvent({ type: "Email", changed: true })).toEqual([
      "Email",
    ])
    expect(normalizePushEvent({ type: "Mailbox", changed: true })).toEqual([
      "Mailbox",
    ])
  })

  it("extracts entity types from a real StateChange changed map", () => {
    expect(
      normalizePushEvent({
        type: "StateChange",
        changed: { a1: { Email: "5", Mailbox: "2" } },
      })
    ).toEqual(expect.arrayContaining(["Email", "Mailbox"]))
  })

  it("ignores unknown types and empty payloads", () => {
    expect(normalizePushEvent({ type: "Identity" })).toEqual([])
    expect(normalizePushEvent({})).toEqual([])
    expect(normalizePushEvent({ changed: { a1: { Unknown: "1" } } })).toEqual([])
  })
})
