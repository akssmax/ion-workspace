import { describe, expect, it } from "vitest"
import { toJmapRequest } from "./ServerProxyTransport"
import { assertJmapRequest } from "../client/validate"
import { JMAP_CAPS, type JmapSession } from "../types"

const session = {
  capabilities: { [JMAP_CAPS.CORE]: {}, [JMAP_CAPS.MAIL]: {}, [JMAP_CAPS.SUBMISSION]: {}, "urn:ietf:params:jmap:vacationresponse": {} },
} as unknown as JmapSession

describe("real JMAP request envelope", () => {
  it("uses only advertised capabilities and converts query result references", () => {
    const result = toJmapRequest([
      [JMAP_CAPS.CORE, { using: [JMAP_CAPS.CORE, JMAP_CAPS.MAIL, JMAP_CAPS.FILES] }, "d0"],
      ["Email/query", { accountId: "a1" }, "q1"],
      ["Email/get", { accountId: "a1", ids: ["#q1"] }, "g1", { resultOf: { callId: "q1", name: "Email/query", path: "/ids/*" } }],
    ], session)
    expect(result.using).toEqual([JMAP_CAPS.CORE, JMAP_CAPS.MAIL])
    expect(result.methodCalls[1]).toEqual(["Email/get", { accountId: "a1", "#ids": { resultOf: "q1", name: "Email/query", path: "/ids/*" } }, "g1"])
    // Regression: the serialized envelope must always match RFC 8620 §3.3.
    expect(() => assertJmapRequest(result)).not.toThrow()
  })

  it("fails fast when no requested capability is advertised", () => {
    // A stale session without capabilities would previously produce a
    // server-side `notRequest` 400; we now reject it locally.
    const emptySession = { capabilities: {} } as unknown as JmapSession
    expect(() =>
      toJmapRequest(
        [
          [JMAP_CAPS.CORE, { using: [JMAP_CAPS.CORE] }, "d0"],
          ["Mailbox/get", { accountId: "a1" }, "c0"],
        ],
        emptySession
      )
    ).toThrow()
  })

  it("converts submission's created email reference", () => {
    const result = toJmapRequest([
      [JMAP_CAPS.CORE, { using: [JMAP_CAPS.CORE, JMAP_CAPS.MAIL, JMAP_CAPS.SUBMISSION] }, "d0"],
      ["Email/set", { accountId: "a1", create: { send: {} } }, "e1"],
      ["EmailSubmission/set", { accountId: "a1", create: { send: { emailId: "#e1", identityId: "i1" } } }, "s1", { resultOf: { callId: "e1", name: "Email/set", path: "/created/send/id" } }],
    ], session)
    expect((result.methodCalls[1][1] as { create: { send: Record<string, unknown> } }).create.send).toEqual({ identityId: "i1", "#emailId": { resultOf: "e1", name: "Email/set", path: "/created/send/id" } })
  })
})
