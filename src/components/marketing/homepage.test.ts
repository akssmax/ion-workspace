import { createElement } from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { LandingPage } from "@/components/landing/landing-page"

const state = vi.hoisted(() => ({ signedIn: false }))
vi.mock("@/hooks/use-session", () => ({
  useSession: () => ({
    data: state.signedIn ? { userId: "existing-user" } : null,
  }),
}))
describe("marketing homepage", () => {
  it("provides visible server-rendered content and an unauthenticated demo link", () => {
    state.signedIn = false
    const html = renderToString(createElement(LandingPage))
    expect(html).toContain("Business email.")
    expect(html).toContain('href="/demo"')
    expect(html).toContain("Private pilot")
    expect(html).toContain("Sign in")
  })
  it("keeps marketing visible for signed-in visitors and links to their workspace", () => {
    state.signedIn = true
    const html = renderToString(createElement(LandingPage))
    expect(html).toContain("Business email.")
    expect(html).toContain('href="/app"')
    expect(html).toContain("Open workspace")
    expect(html).not.toContain('aria-label="Mailbox header"')
  })
})
