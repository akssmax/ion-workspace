// @vitest-environment jsdom
import { createElement } from "react"
import { act, cleanup, render } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import FaultyTerminal from "./FaultyTerminal"

const gpu = vi.hoisted(() => {
  const uniforms: Record<string, { value: unknown }> = {}
  return { render: vi.fn(), dispose: vi.fn(), uniforms }
})
vi.mock("ogl", () => ({
  Renderer: class {
    dpr = 1
    gl = {
      canvas: document.createElement("canvas"),
      clearColor: vi.fn(),
      getExtension: () => ({ loseContext: gpu.dispose }),
    }
    setSize(width: number, height: number) {
      this.gl.canvas.width = width * this.dpr
      this.gl.canvas.height = height * this.dpr
    }
    render = gpu.render
  },
  Program: class {
    uniforms: Record<string, { value: unknown }>
    constructor(
      _gl: unknown,
      options: { uniforms: Record<string, { value: unknown }> }
    ) {
      this.uniforms = options.uniforms
      gpu.uniforms = this.uniforms
    }
    remove() {}
  },
  Triangle: class {
    remove() {}
  },
  Mesh: class {},
  Color: class extends Array<number> {
    constructor(...values: number[]) {
      super(...values)
    }
  },
}))

let intersect: (entries: Array<{ isIntersecting: boolean }>) => void
let resize: () => void
let motion: EventTarget & { matches: boolean }
beforeEach(() => {
  vi.useFakeTimers()
  gpu.render.mockClear()
  gpu.dispose.mockClear()
  motion = Object.assign(new EventTarget(), { matches: false })
  vi.stubGlobal("matchMedia", () => motion)
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resize = callback
      }
      observe() {}
      disconnect() {}
    }
  )
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: typeof intersect) {
        intersect = callback
      }
      observe() {}
      disconnect() {}
    }
  )
  vi.spyOn(document, "hidden", "get").mockReturnValue(false)
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(2000)
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(1000)
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(performance.now()), 16)
  )
  vi.stubGlobal("cancelAnimationFrame", clearTimeout)
})
afterEach(() => {
  cleanup()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it("caps the framebuffer and stops rendering offscreen and in hidden tabs", () => {
  const { container, unmount } = render(
    createElement(FaultyTerminal, {
      maxPixels: 600_000,
      maxFps: 24,
      mouseReact: false,
    })
  )
  const canvas = container.querySelector("canvas")!
  expect(canvas.width * canvas.height).toBeLessThanOrEqual(600_000)
  act(() => {
    vi.advanceTimersByTime(100)
  })
  expect(gpu.render).not.toHaveBeenCalled()
  act(() => {
    intersect([{ isIntersecting: true }])
    vi.advanceTimersByTime(100)
  })
  expect(gpu.render).toHaveBeenCalled()
  act(() => {
    intersect([{ isIntersecting: false }])
  })
  const count = gpu.render.mock.calls.length
  act(() => {
    vi.advanceTimersByTime(1000)
  })
  expect(gpu.render).toHaveBeenCalledTimes(count)
  expect(vi.getTimerCount()).toBe(0)
  act(() => {
    intersect([{ isIntersecting: true }])
    vi.advanceTimersByTime(100)
  })
  expect(gpu.render.mock.calls.length).toBeGreaterThan(count)
  act(() => {
    vi.spyOn(document, "hidden", "get").mockReturnValue(true)
    document.dispatchEvent(new Event("visibilitychange"))
  })
  expect(vi.getTimerCount()).toBe(0)
  unmount()
  expect(gpu.dispose).toHaveBeenCalledOnce()
})

it("draws a still frame for reduced motion and cleans up on GPU context loss", () => {
  motion.matches = true
  const { container } = render(createElement(FaultyTerminal))
  act(() => {
    intersect([{ isIntersecting: true }])
    vi.advanceTimersByTime(500)
  })
  expect(gpu.render).toHaveBeenCalledTimes(1)
  expect(vi.getTimerCount()).toBe(0)
  act(() => {
    motion.matches = false
    motion.dispatchEvent(new Event("change"))
    vi.advanceTimersByTime(100)
  })
  expect(gpu.render.mock.calls.length).toBeGreaterThan(1)
  const canvas = container.querySelector("canvas")!
  act(() => {
    canvas.dispatchEvent(new Event("webglcontextlost"))
  })
  expect(vi.getTimerCount()).toBe(0)
  expect(canvas.style.visibility).toBe("hidden")
})

it("keeps square cells the same CSS size across landscape and portrait resizing", () => {
  render(
    createElement(FaultyTerminal, {
      scale: 1.5,
      gridMul: [1, 1],
      maxPixels: 600_000,
    })
  )
  function cellSize(width: number, height: number) {
    const aspect = (gpu.uniforms.iResolution.value as number[])[2]
    const scale = gpu.uniforms.uScale.value as number
    return [width / (aspect * scale * 15), height / (scale * 15)]
  }
  const [wideX, wideY] = cellSize(2000, 1000)
  expect(wideX).toBeCloseTo(wideY)
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(390)
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(650)
  act(() => resize())
  const [narrowX, narrowY] = cellSize(390, 650)
  expect(narrowX).toBeCloseTo(narrowY)
  expect(narrowX).toBeCloseTo(wideX)
})

it("responds to overlay pointer events once per render and ignores pointers outside the hero", () => {
  const bounds = vi
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockReturnValue({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
  render(createElement(FaultyTerminal, { mouseReact: true, maxFps: 24 }))
  act(() => intersect([{ isIntersecting: true }]))
  bounds.mockClear()
  act(() => {
    for (let i = 0; i < 100; i++)
      window.dispatchEvent(
        new MouseEvent("pointermove", { clientX: 200, clientY: 150 })
      )
  })
  expect(bounds).not.toHaveBeenCalled()
  act(() => vi.advanceTimersByTime(20))
  expect(bounds).toHaveBeenCalledTimes(1)
  const mouse = gpu.uniforms.uMouse.value as Float32Array
  expect(mouse[0]).toBeCloseTo(0.25)
  expect(mouse[1]).toBeCloseTo(0.75)
  act(() => {
    window.dispatchEvent(
      new MouseEvent("pointermove", { clientX: 900, clientY: 150 })
    )
    vi.advanceTimersByTime(100)
  })
  expect(mouse[0]).toBeLessThan(0)
  act(() => intersect([{ isIntersecting: false }]))
  bounds.mockClear()
  act(() => {
    window.dispatchEvent(
      new MouseEvent("pointermove", { clientX: 200, clientY: 150 })
    )
    vi.advanceTimersByTime(100)
  })
  expect(bounds).not.toHaveBeenCalled()
})
