/**
 * React Query client configuration.
 */

import { QueryClient } from "@tanstack/react-query"

export function createWorkspaceQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Retry only idempotent-ish transient errors (like JMAP network code 106).
          if (isRetryableError(error)) return failureCount < 2
          return false
        },
        refetchOnWindowFocus: false,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

function isRetryableError(error: unknown): boolean {
  if (error && typeof error === "object" && "isAppError" in error) {
    const code = (error as { code?: string }).code
    return !!code && ["106", "transport"].includes(code)
  }
  return false
}

/** Single, stable key for the signed-in account (one account per session). */
export const ACCOUNT_KEY = "acc"
