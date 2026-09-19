import { describe, expect, it } from "vitest"
import { summarizeError, toErrorReportText } from "./errors"

function crashWithStack(): Error {
  const error = new TypeError("cursor.getFullYear is not a function")
  error.stack = [
    "TypeError: cursor.getFullYear is not a function",
    "    at buildMonthGrid (http://localhost:3000/src/components/calendar/calendar-view.tsx:269:32)",
    "    at CalendarView (http://localhost:3000/src/components/calendar/calendar-view.tsx:50:19)",
    "    at renderWithHooks (http://localhost:3000/node_modules/.pnpm/react-dom@19.3.0/node_modules/react-dom/dist/cjs/react-dom.development.js:1234:56)",
    "    at executeMiddleware (http://localhost:3000/node_modules/.pnpm/@tanstack+start-client-core@1.170.32/node_modules/@tanstack/start-client-core/dist/esm/createServerFn.js:94:20)",
  ].join("\n")
  return error
}

describe("summarizeError", () => {
  it("extracts name and message", () => {
    const summary = summarizeError(crashWithStack())
    expect(summary.name).toBe("TypeError")
    expect(summary.message).toBe("cursor.getFullYear is not a function")
  })

  it("keeps app frames and drops framework noise", () => {
    const { relevantFrames } = summarizeError(crashWithStack())
    expect(relevantFrames).toHaveLength(2)
    expect(relevantFrames[0]).toContain(
      "src/components/calendar/calendar-view.tsx:269:32"
    )
    expect(relevantFrames[1]).toContain(
      "src/components/calendar/calendar-view.tsx:50:19"
    )
    for (const frame of relevantFrames) {
      expect(frame).not.toContain("node_modules")
      expect(frame).not.toContain("tanstack")
    }
  })

  it("falls back to raw frames when nothing looks like app code", () => {
    const error = new Error("boom")
    error.stack = [
      "Error: boom",
      "    at renderWithHooks (http://localhost:3000/node_modules/react-dom/cjs/react-dom.development.js:10:5)",
    ].join("\n")
    const { relevantFrames } = summarizeError(error)
    expect(relevantFrames).toHaveLength(1)
    expect(relevantFrames[0]).toContain("renderWithHooks")
  })

  it("handles non-Error values", () => {
    expect(summarizeError("plain failure").message).toBe("plain failure")
    expect(summarizeError("plain failure").relevantFrames).toEqual([])
    expect(summarizeError(undefined).message).toContain("undefined")
  })
})

describe("toErrorReportText", () => {
  it("includes context and relevant code", () => {
    const text = toErrorReportText(summarizeError(crashWithStack()), {
      route: "/",
      boundary: "calendar",
    })
    expect(text).toContain("cursor.getFullYear is not a function")
    expect(text).toContain("Route: /")
    expect(text).toContain("Boundary: calendar")
    expect(text).toContain("Relevant code:")
    expect(text).toContain("calendar-view.tsx:269:32")
  })
})
