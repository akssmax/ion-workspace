import { describe, expect, it } from "vitest"
import { combineMailFilters, MAIL_QUICK_FILTERS, mailSortComparators } from "./mail-list"

describe("mail list query controls", () => {
  it("uses the recipient and sent time when sorting Sent", () => {
    expect(mailSortComparators("correspondent-asc", true)).toEqual([
      { property: "to", isAscending: true },
      { property: "sentAt", isAscending: false },
    ])
    expect(mailSortComparators("oldest", false)).toEqual([{ property: "receivedAt", isAscending: true }])
    expect(mailSortComparators("newest", true, ["receivedAt", "to"])).toEqual([{ property: "receivedAt", isAscending: false }])
  })
  it("combines independent quick filters with a search and mailbox constraint", () => {
    expect(combineMailFilters({ inMailbox: "inbox" }, { from: "pat@example.com" }, ...MAIL_QUICK_FILTERS.map(filter => filter.clause))).toEqual({
      operator: "AND",
      conditions: [{ inMailbox: "inbox" }, { from: "pat@example.com" }, { notKeyword: "$seen" }, { hasKeyword: "$flagged" }, { hasAttachment: true }],
    })
  })
})
