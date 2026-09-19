// @vitest-environment jsdom
import { createElement } from "react"
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { usePreferences, useSavePreferences } from "@/queries/preferences"
import {
  useMailTemplates,
  useSaveMailTemplate,
  useDeleteMailTemplate,
} from "@/queries/mail-templates"
import {
  useSavedMailSearches,
  useSaveMailSearch,
  useDeleteMailSearch,
} from "@/queries/mail-searches"

const network = vi.hoisted(() => ({
  getPreferences: vi.fn(),
  savePreferences: vi.fn(),
  templatesAvailable: vi.fn(),
  listMailTemplates: vi.fn(),
  saveMailTemplate: vi.fn(),
  deleteMailTemplate: vi.fn(),
  listSavedMailSearches: vi.fn(),
  saveMailSearch: vi.fn(),
  deleteMailSearch: vi.fn(),
}))
vi.mock("@/lib/demo/runtime", () => ({ isDemoRuntime: true }))
vi.mock("@/server/preferences.rpc", () => network)
vi.mock("@/server/mail-templates.rpc", () => network)
vi.mock("@/server/mail-searches.rpc", () => network)
vi.mock("@/hooks/use-session", () => ({
  useSession: () => ({ data: { accountId: "demo" } }),
}))
afterEach(cleanup)
function wrapper({ children }: { children: ReactNode }) {
  return createElement(
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    },
    children
  )
}
describe("demo account metadata", () => {
  it("reads and updates preferences in memory", async () => {
    const hook = renderHook(
      () => ({ prefs: usePreferences(), save: useSavePreferences() }),
      { wrapper }
    )
    await waitFor(() => expect(hook.result.current.prefs.isSuccess).toBe(true))
    expect(hook.result.current.prefs.data).toEqual({})
    await act(async () => {
      await hook.result.current.save.mutateAsync({
        signatureText: "Demo signature",
      })
    })
    await waitFor(() =>
      expect(hook.result.current.prefs.data?.signatureText).toBe(
        "Demo signature"
      )
    )
  })
  it("creates and removes sample templates without touching account templates", async () => {
    const hook = renderHook(
      () => ({
        list: useMailTemplates(),
        save: useSaveMailTemplate(),
        remove: useDeleteMailTemplate(),
      }),
      { wrapper }
    )
    await waitFor(() => expect(hook.result.current.list.available).toBe(true))
    let id = ""
    await act(async () => {
      id = (
        await hook.result.current.save.mutateAsync({
          name: "Demo",
          subject: "Sample",
          htmlBody: "<p>Sample</p>",
        })
      ).id
    })
    await waitFor(() =>
      expect(hook.result.current.list.templates).toHaveLength(1)
    )
    await act(async () => {
      await hook.result.current.remove.mutateAsync(id)
    })
    await waitFor(() =>
      expect(hook.result.current.list.templates).toHaveLength(0)
    )
  })
  it("keeps saved searches local too", async () => {
    const hook = renderHook(
      () => ({
        list: useSavedMailSearches(true),
        save: useSaveMailSearch(),
        remove: useDeleteMailSearch(),
      }),
      { wrapper }
    )
    await waitFor(() => expect(hook.result.current.list.isSuccess).toBe(true))
    let id = ""
    await act(async () => {
      id = (
        await hook.result.current.save.mutateAsync({
          name: "Sample",
          query: "has:attachment",
        })
      ).id
    })
    await waitFor(() => expect(hook.result.current.list.data).toHaveLength(1))
    await act(async () => {
      await hook.result.current.remove.mutateAsync(id)
    })
    await waitFor(() => expect(hook.result.current.list.data).toHaveLength(0))
  })
  it("never called a real metadata endpoint", () => {
    for (const call of Object.values(network))
      expect(call).not.toHaveBeenCalled()
  })
})
