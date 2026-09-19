import { describe, expect, it, vi } from "vitest"
import { createPilotHandler } from "./pilot-request.server"

const request = {
  name: "Test Person",
  email: "test@example.test",
  company: "Example",
  teamSize: "11–50",
  requirements: "Sample request",
  source: "enterprise",
  website: "",
  requestId: "a071f236-f73c-4c7c-b945-f39b91755e50",
}
const endpoint = "https://forms.example.test/pilot"
describe("pilot delivery", () => {
  it("is unavailable without a valid HTTPS endpoint", async () => {
    for (const value of [
      undefined,
      "http://forms.example.test",
      "https://user:secret@example.test",
      "bad",
    ]) {
      const fetcher = vi.fn()
      const handler = createPilotHandler({ endpoint: value, fetcher })
      expect(handler.available).toBe(false)
      expect(await handler.submit(request)).toEqual({
        ok: false,
        reason: "unavailable",
      })
      expect(fetcher).not.toHaveBeenCalled()
    }
  })
  it("validates required fields, sizes, length, and honeypot before delivery", async () => {
    const fetcher = vi.fn()
    const handler = createPilotHandler({ endpoint, fetcher })
    for (const patch of [
      { name: " " },
      { email: "bad" },
      { teamSize: "anything" },
      { website: "spam" },
      { requirements: "a".repeat(3001) },
    ]) {
      expect(await handler.submit({ ...request, ...patch })).toEqual({
        ok: false,
        reason: "invalid",
      })
    }
    expect(fetcher).not.toHaveBeenCalled()
  })
  it("sends metadata and credentials server-side, confirms 2xx, and deduplicates", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 202 }))
    const handler = createPilotHandler({
      endpoint,
      token: "test-token",
      fetcher,
      now: () => 1000,
    })
    expect(await handler.submit(request)).toEqual({
      ok: true,
      requestId: request.requestId,
    })
    expect(await handler.submit(request)).toEqual({
      ok: true,
      requestId: request.requestId,
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
    const [url, init] = fetcher.mock.calls[0]
    expect(url).toBe(endpoint)
    expect(init.headers.Authorization).toBe("Bearer test-token")
    expect(init.headers["Idempotency-Key"]).toBe(request.requestId)
    expect(init.redirect).toBe("error")
    expect(JSON.parse(init.body)).toMatchObject({
      sourcePage: "/enterprise",
      submittedAt: "1970-01-01T00:00:01.000Z",
      name: request.name,
    })
    expect(JSON.parse(init.body)).not.toHaveProperty("website")
  })
  it("never reports success for non-2xx or network failure and permits retry", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
    const handler = createPilotHandler({ endpoint, fetcher })
    expect(await handler.submit(request)).toEqual({
      ok: false,
      reason: "delivery",
    })
    expect(await handler.submit(request)).toEqual({
      ok: false,
      reason: "delivery",
    })
    expect(await handler.submit(request)).toEqual({
      ok: true,
      requestId: request.requestId,
    })
  })
  it("blocks simultaneous duplicate requests", async () => {
    let resolve!: (response: Response) => void
    const fetcher = vi.fn(
      () =>
        new Promise<Response>((r) => {
          resolve = r
        })
    )
    const handler = createPilotHandler({ endpoint, fetcher })
    const pending = handler.submit(request)
    expect(await handler.submit(request)).toEqual({
      ok: false,
      reason: "limited",
    })
    resolve(new Response(null, { status: 200 }))
    expect((await pending).ok).toBe(true)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it("limits repeated attempts and resets after the window", async () => {
    let time = 0
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 500 }))
    const handler = createPilotHandler({ endpoint, fetcher, now: () => time })
    for (let i = 0; i < 3; i++) await handler.submit(request)
    expect(await handler.submit(request)).toEqual({
      ok: false,
      reason: "limited",
    })
    time = 15 * 60_000 + 1
    expect(await handler.submit(request)).toEqual({
      ok: false,
      reason: "delivery",
    })
  })
})
