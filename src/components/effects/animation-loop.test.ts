import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createAnimationLoop } from "./animation-loop"

describe("decorative animation scheduling", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      setTimeout(() => callback(performance.now()), 16)
    )
    vi.stubGlobal("cancelAnimationFrame", clearTimeout)
  })
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })
  it("caps GPU renders even when animation frames are available at 60 Hz", () => {
    const render = vi.fn()
    const loop = createAnimationLoop(render, 24)
    loop.start()
    vi.advanceTimersByTime(1000)
    expect(render.mock.calls.length).toBeGreaterThan(10)
    expect(render.mock.calls.length).toBeLessThanOrEqual(24)
    loop.stop()
  })
  it("suspends all scheduled work and resumes without duplicate loops", () => {
    const render = vi.fn()
    const loop = createAnimationLoop(render, 24)
    loop.start()
    loop.start()
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(20)
    loop.stop()
    expect(vi.getTimerCount()).toBe(0)
    const count = render.mock.calls.length
    vi.advanceTimersByTime(5000)
    expect(render).toHaveBeenCalledTimes(count)
    loop.start()
    vi.advanceTimersByTime(20)
    expect(render).toHaveBeenCalledTimes(count + 1)
    loop.stop()
  })
  it("cancels a pending frame on unmount before the first paint", () => {
    const render = vi.fn()
    const loop = createAnimationLoop(render, 24)
    loop.start()
    loop.stop()
    vi.advanceTimersByTime(1000)
    expect(render).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
  it("does not reschedule when rendering itself stops the loop", () => {
    const loop = createAnimationLoop(() => loop.stop(), 24)
    loop.start()
    vi.advanceTimersByTime(20)
    expect(vi.getTimerCount()).toBe(0)
  })
})
