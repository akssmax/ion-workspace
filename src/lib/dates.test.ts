import { describe, expect, it } from "vitest"
import {
  addDaysDelta,
  dateToUtc,
  dayBounds,
  durationToMinutes,
  emailListTime,
  formatDate,
  formatDay,
  formatRelative,
  formatTime,
  isSameMonthWith,
  minutesToDuration,
  monthBounds,
  coerceDate,
  startOfDayDate,
  toDate,
  toJmapInstant,
  utcToDate,
} from "./dates"

describe("toDate", () => {
  it("passes Dates through", () => {
    const d = new Date("2025-06-01T00:00:00Z")
    expect(toDate(d)).toBe(d)
  })

  it("treats epoch numbers as ms when above 1e12", () => {
    const epoch = Date.UTC(2025, 5, 1)
    expect(toDate(epoch).toISOString()).toBe("2025-06-01T00:00:00.000Z")
  })

  it("parses ISO strings", () => {
    const d = toDate("2025-06-01T12:30:00Z")
    expect(d.getUTCHours()).toBe(12)
    expect(d.getUTCMinutes()).toBe(30)
  })
})

describe("formatTime", () => {
  it("formats a time", () => {
    const t = formatTime(new Date(2025, 5, 1, 14, 30))
    expect(t).toMatch(/2:30 PM|14:30/)
  })
})

describe("formatDay", () => {
  it("labels today", () => {
    expect(formatDay(new Date())).toBe("Today")
  })

  it("labels yesterday", () => {
    expect(formatDay(addDaysDelta(new Date(), -1))).toBe("Yesterday")
  })

  it("labels tomorrow", () => {
    expect(formatDay(addDaysDelta(new Date(), 1))).toBe("Tomorrow")
  })

  it("uses a weekday for <7 days out", () => {
    const wednesday = new Date("2026-09-23T12:00:00")
    expect(formatDay(wednesday)).toBe("Wednesday")
  })
})

describe("formatDate", () => {
  it("applies the custom format", () => {
    expect(formatDate(new Date("2025-06-01T00:00:00Z"), "yyyy-MM-dd")).toBe(
      "2025-06-01"
    )
  })

  it("defaults to MMM d, yyyy", () => {
    expect(formatDate(new Date("2025-06-01T00:00:00Z"))).toBe("Jun 1, 2025")
  })
})

describe("formatRelative", () => {
  it("returns a strict relative distance", () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    expect(formatRelative(tenMinutesAgo)).toBe("10 minutes ago")
  })
})

describe("utc <-> instant conversion", () => {
  it("toJmapInstant emits ISO", () => {
    expect(toJmapInstant(new Date("2025-06-01T00:00:00.000Z"))).toBe(
      "2025-06-01T00:00:00.000Z"
    )
  })

  it("dateToUtc emits ms epoch", () => {
    expect(dateToUtc(new Date(0))).toBe("0")
  })

  it("utcToDate parses", () => {
    expect(utcToDate("2025-06-01T00:00:00Z").toISOString()).toBe(
      "2025-06-01T00:00:00.000Z"
    )
  })
})

describe("bounds", () => {
  it("monthBounds snaps to month edges", () => {
    const { start, end } = monthBounds(new Date("2025-06-15T10:00:00Z"))
    expect(start.toISOString()).toBe("2025-06-01T00:00:00.000Z")
    expect(end.toISOString()).toBe("2025-06-30T23:59:59.999Z")
  })

  it("dayBounds covers a day", () => {
    const { start, end } = dayBounds(new Date("2025-06-15T10:00:00Z"))
    expect(start.toISOString()).toBe("2025-06-15T00:00:00.000Z")
    expect(end.toISOString()).toBe("2025-06-15T23:59:59.999Z")
  })

  it("startOfDayDate snaps to midnight", () => {
    expect(startOfDayDate(new Date("2025-06-15T10:00:00Z")).toISOString()).toBe(
      "2025-06-15T00:00:00.000Z"
    )
  })
})

describe("calendar navigation helpers", () => {
  it("addDaysDelta shifts calendar days", () => {
    const d = addDaysDelta(new Date("2025-06-15T10:00:00Z"), 3)
    expect(d.toISOString()).toBe("2025-06-18T10:00:00.000Z")
  })

  it("isSameMonthWith matches month only", () => {
    expect(
      isSameMonthWith(new Date("2025-06-01"), new Date("2025-06-30"))
    ).toBe(true)
    expect(
      isSameMonthWith(new Date("2025-06-30"), new Date("2025-07-01"))
    ).toBe(false)
  })
})

describe("duration helpers", () => {
  it("minutesToDuration renders compact units", () => {
    expect(minutesToDuration(30)).toBe("30m")
    expect(minutesToDuration(60)).toBe("1h")
    expect(minutesToDuration(90)).toBe("1h 30m")
    expect(minutesToDuration(0)).toBe("0m")
  })

  it("durationToMinutes defaults to 60 minutes", () => {
    expect(durationToMinutes(undefined)).toBe(60)
  })

  it("parses PT#H#M durations", () => {
    expect(durationToMinutes("PT1H")).toBe(60)
    expect(durationToMinutes("PT1H30M")).toBe(90)
    expect(durationToMinutes("PT45M")).toBe(45)
  })
})

describe("emailListTime", () => {
  it("uses HH:mm for today", () => {
    expect(emailListTime(new Date())).toMatch(/^\d{2}:\d{2}$/)
  })

  it("uses a weekday inside the current week", () => {
    const date = addDaysDelta(new Date(), -1)
    const result = emailListTime(date)
    expect(result).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/)
  })
})

describe("coerceDate", () => {
  it("passes valid Dates through", () => {
    const d = new Date(2026, 8, 19, 12)
    expect(coerceDate(d)).toBe(d)
  })

  it("rejects invalid Dates", () => {
    expect(coerceDate(new Date(Number.NaN))).toBeNull()
  })

  it("revives ISO strings from JSON persistence", () => {
    const original = new Date(2026, 8, 19)
    const revived = coerceDate(JSON.parse(JSON.stringify(original)))
    expect(revived).toBeInstanceOf(Date)
    expect(revived?.getFullYear()).toBe(2026)
    expect(revived?.getTime()).toBe(original.getTime())
  })

  it("revives epoch numbers and numeric strings", () => {
    const epoch = Date.UTC(2026, 0, 2)
    expect(coerceDate(epoch)?.getTime()).toBe(epoch)
    expect(coerceDate(String(epoch))?.getTime()).toBe(epoch)
  })

  it("returns null for garbage", () => {
    expect(coerceDate(undefined)).toBeNull()
    expect(coerceDate(null)).toBeNull()
    expect(coerceDate("")).toBeNull()
    expect(coerceDate("not-a-date")).toBeNull()
    expect(coerceDate({})).toBeNull()
    expect(coerceDate(Number.NaN)).toBeNull()
  })
})
