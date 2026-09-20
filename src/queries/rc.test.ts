// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import { useMutation } from "@tanstack/react-query"

describe("callbacks", () => {
  it("hook + call onSuccess both run", async () => {
    const hookCb = vi.fn(); const callCb = vi.fn()
    const client = new QueryClient()
    const { result } = renderHook(() => useMutation({ mutationFn: async () => 1, onSuccess: hookCb }), { wrapper: ({children}) => React.createElement(QueryClientProvider, {client}, children) })
    await act(async () => { await result.current.mutateAsync(undefined, { onSuccess: callCb }) })
    expect(hookCb).toHaveBeenCalledTimes(1)
    expect(callCb).toHaveBeenCalledTimes(1)
  })
})
