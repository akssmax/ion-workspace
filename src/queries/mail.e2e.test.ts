// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import { MockJmapProvider } from "../jmap/provider/MockJmapProvider"
import type { JmapClient } from "../jmap/client/JmapClient"

let client: JmapClient
let accountId = ""

vi.mock("../services/jmap.service", () => ({
  getPrimaryAccountId: () => Promise.resolve(accountId),
  getJmapClient: () => Promise.resolve(client),
}))

vi.mock("../jmap/sync/sync.engine", () => ({
  syncEngine: {
    storeMailPage: () => Promise.resolve(),
    offlineMailPage: () => Promise.reject(new Error("no")),
  },
}))

vi.mock("../services/auth/auth.service", () => ({
  fetchSession: () => Promise.resolve({ userId: "u1", accountId }),
}))

import { useArchiveEmails, useEmails, useMailboxes } from "./mail"

function wrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe("e2e archive updates mailbox counts (mock server)", () => {
  beforeEach(async () => {
    const provider = new MockJmapProvider()
    client = await provider.createClient()
    accountId = (await client.session()).primaryAccounts["urn:ietf:params:jmap:mail"]
  })

  it("inbox total and unread drop after archive", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(
      () => ({ boxes: useMailboxes(), emails: useEmails({ mailboxId: "all" }), archive: useArchiveEmails() }),
      { wrapper: wrapper(qc) }
    )

    await waitFor(() => expect(result.current.boxes.data?.length).toBeGreaterThan(0))
    const inbox = result.current.boxes.data!.find((m) => m.role === "inbox")!
    const beforeTotal = inbox.totalEmails ?? 0
    expect(beforeTotal).toBeGreaterThan(0)

    // Grab an inbox thread id from a fresh query before archiving.
    const list = await client.mail.queryEmails(inbox.id, { collapseThreads: true })
    const threadId = list.ids[0]

    await act(async () => {
      await result.current.archive.mutateAsync([threadId])
    })

    await waitFor(() => {
      const after = result.current.boxes.data!.find((m) => m.role === "inbox")!
      expect(after.totalEmails).toBe(beforeTotal - 1)
    })
  })
})
