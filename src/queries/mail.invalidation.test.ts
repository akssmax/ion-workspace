// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"

const getMailboxes = vi.fn()
const archiveEmails = vi.fn()

vi.mock("../services/mail/mail.service", () => ({
  getMailboxes: (...args: unknown[]) => getMailboxes(...args),
  archiveEmails: (...args: unknown[]) => archiveEmails(...args),
}))

vi.mock("../services/auth/auth.service", () => ({
  fetchSession: () => Promise.resolve({ userId: "u1", accountId: "a1" }),
}))

import { useArchiveEmails, useMailboxes } from "./mail"

function wrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
}

describe("mailbox invalidation after archive", () => {
  beforeEach(() => {
    getMailboxes.mockReset()
    archiveEmails.mockReset()
  })

  it("refetches mailboxes after archive", async () => {
    let archived = false
    getMailboxes.mockImplementation(() =>
      Promise.resolve([
        { id: "inbox", name: "Inbox", role: "inbox", totalEmails: archived ? 3 : 4, unreadEmails: 0 },
        { id: "archive", name: "Archive", role: "archive", totalEmails: archived ? 1 : 0, unreadEmails: 0 },
      ])
    )
    archiveEmails.mockImplementation(() => {
      archived = true
      return Promise.resolve(undefined)
    })

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(
      () => ({ boxes: useMailboxes(), archive: useArchiveEmails() }),
      { wrapper: wrapper(client) }
    )

    await waitFor(() => expect(result.current.boxes.data).toBeDefined())
    expect(result.current.boxes.data?.find((m) => m.id === "inbox")?.totalEmails).toBe(4)
    const before = getMailboxes.mock.calls.length

    await act(async () => {
      await result.current.archive.mutateAsync(["t1"])
    })

    await waitFor(() => expect(getMailboxes.mock.calls.length).toBeGreaterThan(before))
    await waitFor(() =>
      expect(result.current.boxes.data?.find((m) => m.id === "inbox")?.totalEmails).toBe(3)
    )
  })
})
