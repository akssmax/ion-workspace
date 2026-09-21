import { describe, expect, it } from "vitest"
import { rankEmailsByQuery, scoreEmail, scoreTerm, searchTerms } from "./fuzzy"
import type { EmailProperties } from "@/jmap/types/mail"

function email(partial: Partial<EmailProperties>): EmailProperties {
  return {
    id: partial.id ?? "e1",
    threadId: partial.threadId ?? "t1",
    mailboxIds: {},
    ...partial,
  }
}

describe("scoreTerm", () => {
  it("scores a substring match", () => {
    expect(scoreTerm("Quarterly report", "repo")).toBeGreaterThan(0)
  })

  it("rewards word-boundary matches over mid-word matches", () => {
    expect(scoreTerm("weekly report", "report")!).toBeGreaterThan(
      scoreTerm("prereporting", "report")!
    )
  })

  it("matches ordered subsequences", () => {
    expect(scoreTerm("search", "srch")).toBeGreaterThan(0)
  })

  it("returns null when characters are missing or out of order", () => {
    expect(scoreTerm("report", "xyz")).toBeNull()
    expect(scoreTerm("report", "troper")).toBeNull()
  })
})

describe("searchTerms", () => {
  it("keeps quoted phrases together and strips quotes", () => {
    expect(searchTerms('"quarterly report" budget')).toEqual([
      "quarterly report",
      "budget",
    ])
  })
})

describe("scoreEmail", () => {
  it("requires every term to match some field", () => {
    const mail = email({
      subject: "Quarterly report",
      preview: "Numbers for Q3",
    })
    expect(scoreEmail(mail, ["quarterly", "report"])).toBeGreaterThan(0)
    expect(scoreEmail(mail, ["quarterly", "unrelated"])).toBeNull()
  })

  it("matches the sender name and address", () => {
    const mail = email({ from: [{ name: "Jane Doe", email: "jane@acme.io" }] })
    expect(scoreEmail(mail, ["acme"])).toBeGreaterThan(0)
    expect(scoreEmail(mail, ["jane"])).toBeGreaterThan(0)
  })
})

describe("rankEmailsByQuery", () => {
  it("orders by relevance, preferring subject over preview", () => {
    const subjectMatch = email({ id: "a", subject: "budget plan" })
    const previewMatch = email({ id: "b", preview: "budget plan" })
    const ranked = rankEmailsByQuery([previewMatch, subjectMatch], "budget")
    expect(ranked.map((mail) => mail.id)).toEqual(["a", "b"])
  })

  it("tolerates partial words and typos", () => {
    const mail = email({ subject: "Quarterly report" })
    expect(rankEmailsByQuery([mail], "quart")).toHaveLength(1)
    expect(rankEmailsByQuery([mail], "qurtrly")).toHaveLength(1)
  })

  it("drops emails that don't match", () => {
    const mail = email({ subject: "Quarterly report" })
    expect(rankEmailsByQuery([mail], "zzzz")).toHaveLength(0)
  })

  it("returns all emails when the query is blank", () => {
    const mail = email({ subject: "anything" })
    expect(rankEmailsByQuery([mail], "  ")).toEqual([mail])
  })
})
