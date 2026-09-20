import { describe, expect, it } from "vitest"
import { assertJmapRequest } from "./validate"

const valid = {
  using: ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
  methodCalls: [["Mailbox/get", { accountId: "e" }, "c0"]],
}

describe("assertJmapRequest", () => {
  it("accepts a well-formed request", () => {
    expect(() => assertJmapRequest(valid)).not.toThrow()
  })

  it("accepts an optional createdIds object", () => {
    expect(() =>
      assertJmapRequest({ ...valid, createdIds: { draft: "e1" } })
    ).not.toThrow()
  })

  it("rejects a bare array instead of a Request object", () => {
    expect(() => assertJmapRequest(valid.methodCalls)).toThrow()
  })

  it("rejects a missing, empty, or non-array 'using'", () => {
    expect(() => assertJmapRequest({ methodCalls: valid.methodCalls })).toThrow()
    expect(() =>
      assertJmapRequest({ ...valid, using: [] })
    ).toThrow()
    expect(() =>
      assertJmapRequest({ ...valid, using: "urn:ietf:params:jmap:core" })
    ).toThrow()
  })

  it("rejects a method call that is not a 3-element array", () => {
    expect(() =>
      assertJmapRequest({ ...valid, methodCalls: [["Mailbox/get", { accountId: "e" }]] })
    ).toThrow()
    expect(() =>
      assertJmapRequest({
        ...valid,
        methodCalls: [["Mailbox/get", { accountId: "e" }, "c0", { extra: true }]],
      })
    ).toThrow()
  })

  it("rejects non-object arguments", () => {
    expect(() =>
      assertJmapRequest({ ...valid, methodCalls: [["Mailbox/get", "nope", "c0"]] })
    ).toThrow()
  })

  it("rejects array createdIds", () => {
    expect(() =>
      assertJmapRequest({ ...valid, createdIds: [] })
    ).toThrow()
  })
})
