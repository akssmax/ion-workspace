// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { themeBootstrapScript } from "@/theme/apply"

const rpc = vi.hoisted(() => ({
  getAuthSession: vi.fn(),
  getAppConfig: vi.fn(),
  logout: vi.fn(),
  login: vi.fn(),
}))
vi.mock("@/server/auth.rpc", () => rpc)
vi.mock("@/db/db", () => ({
  db: new Proxy(
    {},
    {
      get() {
        throw new Error("Demo touched persistent cache")
      },
    }
  ),
}))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  window.history.replaceState({}, "", "/demo")
})
describe("demo isolation", () => {
  it("uses a synthetic identity without reading the real session", async () => {
    const { fetchSession } = await import("@/services/auth/auth.service")
    expect(await fetchSession()).toMatchObject({
      userId: "ion-demo",
      mode: "mock",
    })
    expect(rpc.getAuthSession).not.toHaveBeenCalled()
  })
  it("does not rehydrate or persist workspace preferences", async () => {
    const read = vi.spyOn(Storage.prototype, "getItem")
    const write = vi.spyOn(Storage.prototype, "setItem")
    const { useWorkspaceStore } = await import("@/stores/workspace.store")
    const { useMailStore } = await import("@/stores/mail.store")
    const { useCalendarStore } = await import("@/stores/calendar.store")
    useWorkspaceStore.getState().setApp("calendar")
    useMailStore.getState().setPaneView("list")
    useCalendarStore.getState().setView("week")
    expect(read).not.toHaveBeenCalled()
    expect(write).not.toHaveBeenCalled()
    read.mockRestore()
    write.mockRestore()
  })
  it("selects a fresh mock client without requesting real configuration", async () => {
    const { getJmapClient, resetJmapClient } =
      await import("@/services/jmap.service")
    const first = await getJmapClient()
    const boxes = await first.mail.getMailboxes()
    const inbox = boxes.find((b) => b.role === "inbox")!
    const initial = await first.mail.getEmails(inbox.id)
    const originalFlags = initial.emails.map((e) => ({
      id: e.id,
      keywords: { ...e.keywords },
    }))
    await first.mail.markRead(
      initial.emails.map((e) => e.id),
      true
    )
    resetJmapClient()
    const next = await getJmapClient()
    expect(next).not.toBe(first)
    const restored = await next.mail.getEmails(inbox.id)
    expect(
      restored.emails.map((e) => ({ id: e.id, keywords: e.keywords }))
    ).toEqual(originalFlags)
    expect(rpc.getAppConfig).not.toHaveBeenCalled()
  })
  it("does not access persistent mail cache, including offline fallback", async () => {
    const { syncEngine } = await import("@/jmap/sync/sync.engine")
    await syncEngine.storeMailPage("real-account", [])
    await syncEngine.ensureMailboxes()
    await syncEngine.cacheThread("real-thread")
    await syncEngine.syncEvents()
    await syncEngine.syncContacts()
    await syncEngine.syncFiles()
    expect(
      await syncEngine.offlineThread("real-account", "real-thread")
    ).toBeNull()
    expect(await syncEngine.cachedEmailsFor("inbox")).toEqual([])
    await expect(
      syncEngine.offlineMailPage("real-account", "inbox", 0, 60)
    ).rejects.toThrow("Demo data is unavailable")
  })
  it("bootstrap remains valid JavaScript and does not read the saved theme", () => {
    const read = vi.spyOn(Storage.prototype, "getItem")
    const run = new Function(themeBootstrapScript("workspace-theme"))
    run()
    expect(read).not.toHaveBeenCalled()
    expect(document.documentElement.style.colorScheme).toBe("light")
    read.mockRestore()
  })
  it("normal documents still use real authentication and storage", async () => {
    window.history.replaceState({}, "", "/app")
    rpc.getAuthSession.mockResolvedValue({ userId: "real-user" })
    const { fetchSession } = await import("@/services/auth/auth.service")
    expect(await fetchSession()).toMatchObject({ userId: "real-user" })
    expect(rpc.getAuthSession).toHaveBeenCalledOnce()
    const { workspaceStorage } = await import("./runtime")
    expect(workspaceStorage()).toBe(localStorage)
  })
})
