// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"

const getEmails = vi.fn()
const archiveEmails = vi.fn()

vi.mock("../services/mail/mail.service", () => ({
  getEmails: (...args: unknown[]) => getEmails(...args),
  archiveEmails: (...args: unknown[]) => archiveEmails(...args),
}))

vi.mock("../services/jmap.service", () => ({
  getPrimaryAccountId: () => Promise.resolve("a1"),
  getJmapClient: () =>
    Promise.resolve({
      session: () => Promise.resolve({ accounts: { a1: { accountCapabilities: {} } }, capabilities: {} }),
    }),
}))

vi.mock("../jmap/sync/sync.engine", () => ({
  syncEngine: {
    storeMailPage: () => Promise.resolve(),
    offlineMailPage: () => Promise.reject(new Error("no")),
  },
}))

vi.mock("../services/auth/auth.service", () => ({
  fetchSession: () => Promise.resolve({ userId: "u1", accountId: "a1" }),
}))

import { useArchiveEmails, useEmails } from "./mail"

function wrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
}

describe("email list invalidation after archive", () => {
  beforeEach(() => {
    getEmails.mockReset()
    archiveEmails.mockReset()
  })

  it("refetches emails after archive and total shrinks", async () => {
    let archived = false
    const page = () => ({
      mailboxes: [],
      queryState: "q",
      position: 0,
      ids: archived ? ["t2", "t3"] : ["t1", "t2", "t3"],
      total: archived ? 2 : 3,
      emails: (archived ? ["t2", "t3"] : ["t1", "t2", "t3"]).map((id) => ({ id, threadId: id })),
      notFound: [],
      state: "s",
    })
    getEmails.mockImplementation(() => Promise.resolve(page()))
    archiveEmails.mockImplementation(() => {
      archived = true
      return Promise.resolve(undefined)
    })

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(
      () => ({ emails: useEmails({ mailboxId: "inbox" }), archive: useArchiveEmails() }),
      { wrapper: wrapper(client) }
    )

    await waitFor(() => expect(result.current.emails.data?.total).toBe(3))

    await act(async () => {
      await result.current.archive.mutateAsync(["t1"])
    })

    await waitFor(() => expect(result.current.emails.data?.total).toBe(2))
  })
})
