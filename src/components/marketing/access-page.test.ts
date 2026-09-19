// @vitest-environment jsdom
import { createElement } from "react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { AccessPage } from "./access-page"

const rpc = vi.hoisted(() => ({
  getPilotAvailability: vi.fn(),
  requestPilotAccess: vi.fn(),
}))
vi.mock("@/server/pilot-request.rpc", () => rpc)
vi.mock("./site", () => ({
  Site: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  Eyebrow: ({ children }: { children: ReactNode }) =>
    createElement("p", null, children),
  TextLink: ({ children, href }: { children: ReactNode; href: string }) =>
    createElement("a", { href }, children),
}))
vi.mock("@/components/landing/landing-grid", () => ({
  Cell: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  LandingRow: ({ children }: { children: ReactNode }) =>
    createElement("section", null, children),
}))
beforeEach(() => {
  vi.clearAllMocks()
  rpc.getPilotAvailability.mockResolvedValue({ available: true })
})
afterEach(cleanup)
async function fill() {
  render(createElement(AccessPage, { source: "enterprise" }))
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", {
          name: /Request pilot access/,
        })
        .hasAttribute("disabled")
    ).toBe(false)
  )
  fireEvent.change(screen.getByLabelText("Your name"), {
    target: { value: "Sample Person" },
  })
  fireEvent.change(screen.getByLabelText("Work email"), {
    target: { value: "sample@example.test" },
  })
  fireEvent.change(screen.getByLabelText("Company"), {
    target: { value: "Sample Company" },
  })
  fireEvent.change(screen.getByLabelText("Team size"), {
    target: { value: "11–50" },
  })
  return screen
    .getByRole("button", { name: /Request pilot access/ })
    .closest("form")!
}
describe("pilot form experience", () => {
  it("disables delivery and explains missing configuration", async () => {
    rpc.getPilotAvailability.mockResolvedValue({ available: false })
    render(createElement(AccessPage, { source: "website" }))
    await screen.findByText(/Pilot requests are temporarily unavailable/)
    expect(
      screen
        .getByRole("button", {
          name: /Request pilot access/,
        })
        .hasAttribute("disabled")
    ).toBe(true)
    expect(rpc.requestPilotAccess).not.toHaveBeenCalled()
  })
  it("preserves input and displays retry feedback on delivery failure", async () => {
    rpc.requestPilotAccess.mockResolvedValue({ ok: false, reason: "delivery" })
    fireEvent.submit(await fill())
    await screen.findByRole("alert")
    expect(screen.getByLabelText("Company")).toMatchObject({
      value: "Sample Company",
    })
    expect(screen.queryByText("Request received")).toBeNull()
    expect(
      screen
        .getByRole("button", {
          name: /Request pilot access/,
        })
        .hasAttribute("disabled")
    ).toBe(false)
  })
  it("guards duplicate submissions and confirms only after delivery", async () => {
    let resolve!: (value: { ok: true; requestId: string }) => void
    rpc.requestPilotAccess.mockReturnValue(
      new Promise((r) => {
        resolve = r
      })
    )
    const form = await fill()
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(rpc.requestPilotAccess).toHaveBeenCalledTimes(1)
    expect(screen.queryByText("Request received")).toBeNull()
    expect(rpc.requestPilotAccess.mock.calls[0][0].data.source).toBe(
      "enterprise"
    )
    resolve({ ok: true, requestId: "sample" })
    await screen.findByText("Request received")
    expect(screen.queryByLabelText("Company")).toBeNull()
  })
})
