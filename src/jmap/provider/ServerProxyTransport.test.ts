import { describe, expect, it } from "vitest"
import { toJmapRequest } from "./ServerProxyTransport"
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
    expect(result.methodCalls[1]).toEqual(["Email/get", { accountId: "a1", "#ids": { callId: "q1", name: "Email/query", path: "/ids/*" } }, "g1"])
  })

  it("converts submission's created email reference", () => {
    const result = toJmapRequest([
      [JMAP_CAPS.CORE, { using: [JMAP_CAPS.CORE, JMAP_CAPS.MAIL, JMAP_CAPS.SUBMISSION] }, "d0"],
      ["Email/set", { accountId: "a1", create: { send: {} } }, "e1"],
      ["EmailSubmission/set", { accountId: "a1", create: { send: { emailId: "#e1", identityId: "i1" } } }, "s1", { resultOf: { callId: "e1", name: "Email/set", path: "/created/send/id" } }],
    ], session)
    expect((result.methodCalls[1][1] as { create: { send: Record<string, unknown> } }).create.send).toEqual({ identityId: "i1", "#emailId": { callId: "e1", name: "Email/set", path: "/created/send/id" } })
  })
})
