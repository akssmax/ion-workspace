// @vitest-environment jsdom
import { createElement } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useTagAppearance } from "./tag-appearance"

vi.mock("@/hooks/use-session", () => ({
  useSession: () => ({ data: { userId: "u1", accountId: "a1" } }),
}))
vi.mock("@/lib/demo/runtime", () => ({ isDemoRuntime: false }))
const state = vi.hoisted<{ stored: Record<string, unknown> }>(() => ({
  stored: {},
}))
vi.mock("@/server/preferences.rpc", () => ({
  getPreferences: async () => state.stored,
  savePreferences: async ({ data }: { data: Record<string, unknown> }) => {
    state.stored = data
    return { ok: true }
  },
}))

afterEach(() => cleanup())

function Harness() {
  const { icon, color, set } = useTagAppearance("mb-1")
  return createElement(
    "div",
    null,
    createElement("span", { "data-testid": "icon" }, icon),
    createElement("span", { "data-testid": "color" }, color),
    createElement(
      "button",
      { type: "button", onClick: () => set({ icon: "rocket" }) },
      "pick"
    )
  )
}

describe("useTagAppearance", () => {
  it("applies a picked icon optimistically and persists it", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      createElement(QueryClientProvider, { client }, createElement(Harness))
    )
    expect(screen.getByTestId("icon").textContent).toBe("tag")
    fireEvent.click(screen.getByText("pick"))
    await waitFor(() =>
      expect(screen.getByTestId("icon").textContent).toBe("rocket")
    )
    // Survives the settle/refetch cycle.
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(screen.getByTestId("icon").textContent).toBe("rocket")
  })
})
