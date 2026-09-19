/** Captured for this document. Demo entry/exit MUST use full document navigation. */
export const isDemoRuntime =
  typeof window !== "undefined" && /^\/demo\/?$/.test(window.location.pathname)

/** No persisted workspace or theme state is read or written by the demo. */
export function workspaceStorage() {
  if (isDemoRuntime)
    return {
      getItem: (_name: string) => null,
      setItem: (_name: string, _value: string) => {},
      removeItem: (_name: string) => {},
    }
  return localStorage
}

export const DEMO_SESSION = {
  userId: "ion-demo",
  username: "Alex Morgan",
  email: "alex@example.test",
  mode: "mock" as const,
  accountId: "a1",
}
