import { describe, expect, it } from "vitest"
import { filterForMailbox, parseSearch } from "./search"

describe("parseSearch", () => {
  it("returns an empty result for empty/whitespace input", () => {
    expect(parseSearch("")).toEqual({
      query: "",
      filter: null,
      mailboxNames: [],
      hasAdvanced: false,
    })
    expect(parseSearch("   ").query).toBe("")
  })

  it("falls back to plain text match", () => {
    const parsed = parseSearch("quarterly report")
    expect(parsed.filter).toEqual({ text: "quarterly report" })
    expect(parsed.hasAdvanced).toBe(false)
  })

  it("maps is:read and is:unread", () => {
    expect(parseSearch("is:read").filter).toEqual({ hasKeyword: "$seen" })
    expect(parseSearch("is:unread").filter).toEqual({ notKeyword: "$seen" })
  })

  it("maps is:starred, is:important and is:draft", () => {
    expect(parseSearch("is:starred").filter).toEqual({ hasKeyword: "$flagged" })
    expect(parseSearch("is:unstarred").filter).toEqual({
      notKeyword: "$flagged",
    })
    expect(parseSearch("is:important").filter).toEqual({
      hasKeyword: "$important",
    })
    expect(parseSearch("is:draft").filter).toEqual({ hasKeyword: "$draft" })
  })

  it("maps has:attachment", () => {
    expect(parseSearch("has:attachment").filter).toEqual({
      hasAttachment: true,
    })
  })

  it("maps from:/to:/subject:/cc:/bcc:", () => {
    expect(parseSearch("from:team@acme.com").filter).toEqual({
      from: "team@acme.com",
    })
    expect(parseSearch("to:boss@acme.com").filter).toEqual({
      to: "boss@acme.com",
    })
    expect(parseSearch("subject:launch").filter).toEqual({ subject: "launch" })
    expect(parseSearch("cc:c@x.io").filter).toEqual({ cc: "c@x.io" })
    expect(parseSearch("bcc:b@x.io").filter).toEqual({ bcc: "b@x.io" })
  })

  it("maps in:/folder:/label: to mailbox names", () => {
    for (const field of ["in", "folder", "label"]) {
      const parsed = parseSearch(`${field}:Work`)
      expect(parsed.mailboxNames).toEqual(["Work"])
      expect(parsed.hasAdvanced).toBe(true)
    }
  })

  it("parses after:/before: into JMAP date strings", () => {
    expect(parseSearch("after:2025-01-01").filter).toEqual({
      after: "2025-01-01T00:00:00Z",
    })
    expect(parseSearch("before:2026-06-01T13:00").filter).toEqual({
      before: "2026-06-01T13:00Z",
    })
  })

  it("ignores invalid date tokens instead of producing a filter", () => {
    expect(parseSearch("before:tomorrow").filter).toBeNull()
  })

  it("supports negated terms via -", () => {
    expect(parseSearch("budget -spam").filter).toEqual({
      allOf: [{ not: { text: "spam" } }, { text: "budget" }],
    })
  })

  it("combines advanced conditions under allOf", () => {
    const parsed = parseSearch("from:finance is:unread has:attachment")
    expect(parsed.filter).toEqual({
      allOf: [
        { from: "finance" },
        { notKeyword: "$seen" },
        { hasAttachment: true },
      ],
    })
  })

  it("gives plain text terms the same weight as operators", () => {
    const parsed = parseSearch("urgent is:starred")
    expect(parsed.filter).toEqual({
      allOf: [{ hasKeyword: "$flagged" }, { text: "urgent" }],
    })
  })

  it("supports quoted phrases", () => {
    const parsed = parseSearch('"end of year" report')
    expect(parsed.filter).toEqual({ text: "end of year report" })
  })
})

describe("filterForMailbox", () => {
  it("returns the mailbox clause alone when no filter", () => {
    const parsed = parseSearch("")
    expect(filterForMailbox(parsed, "mb1")).toEqual({ inMailbox: "mb1" })
  })

  it("combines the mailbox clause with a text filter", () => {
    const parsed = parseSearch("hello")
    expect(filterForMailbox(parsed, "mb1")).toEqual({
      allOf: [{ inMailbox: "mb1" }, { text: "hello" }],
    })
  })

  it("combines the mailbox clause with an advanced filter", () => {
    const parsed = parseSearch("is:unread")
    expect(filterForMailbox(parsed, "mb1")).toEqual({
      allOf: [{ inMailbox: "mb1" }, { notKeyword: "$seen" }],
    })
  })
})
