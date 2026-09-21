// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"

class FakeOscillator {
  type = "sine"
  frequency = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  }
  connect = vi.fn(() => this)
  start = vi.fn()
  stop = vi.fn()
}

class FakeGain {
  gain = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  }
  connect = vi.fn(() => this)
}

class FakeBufferSource {
  buffer: unknown
  connect = vi.fn(() => this)
  start = vi.fn()
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = []
  state: AudioContextState = "running"
  currentTime = 0
  destination = {}
  oscillators: FakeOscillator[] = []
  resume = vi.fn(async () => {
    this.state = "running"
  })
  createOscillator = vi.fn(() => {
    const oscillator = new FakeOscillator()
    this.oscillators.push(oscillator)
    return oscillator
  })
  createGain = vi.fn(() => new FakeGain())
  createBufferSource = vi.fn(() => new FakeBufferSource())
  createBuffer = vi.fn(() => ({}))

  constructor() {
    FakeAudioContext.instances.push(this)
  }
}

async function setup(context: "AudioContext" | "webkitAudioContext") {
  vi.resetModules()
  FakeAudioContext.instances = []
  const global = window as unknown as Record<string, unknown>
  global.AudioContext = undefined
  global.webkitAudioContext = undefined
  global[context] = FakeAudioContext
  return await import("./sound")
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("playNotificationSound", () => {
  it("schedules oscillators when the context is running", async () => {
    const sound = await setup("AudioContext")
    sound.playNotificationSound("beep")
    const ctx = FakeAudioContext.instances[0]
    expect(ctx.oscillators).toHaveLength(1)
    expect(ctx.oscillators[0].start).toHaveBeenCalled()
  })

  it("stays silent for the 'none' preset", async () => {
    const sound = await setup("AudioContext")
    sound.playNotificationSound("none")
    expect(FakeAudioContext.instances).toHaveLength(0)
  })

  it("plays a two-note chime", async () => {
    const sound = await setup("AudioContext")
    sound.playNotificationSound("chime")
    expect(FakeAudioContext.instances[0].oscillators).toHaveLength(2)
  })

  it("falls back to webkitAudioContext (Safari/iOS)", async () => {
    const sound = await setup("webkitAudioContext")
    sound.playNotificationSound("beep")
    expect(FakeAudioContext.instances).toHaveLength(1)
    expect(FakeAudioContext.instances[0].oscillators).toHaveLength(1)
  })

  it("resumes a suspended context before playing", async () => {
    const sound = await setup("AudioContext")
    sound.unlockNotificationAudio()
    const ctx = FakeAudioContext.instances[0]
    ctx.state = "suspended"
    sound.playNotificationSound("beep")
    expect(ctx.resume).toHaveBeenCalled()
    await Promise.resolve()
    await Promise.resolve()
    expect(ctx.oscillators).toHaveLength(1)
  })
})

describe("unlockNotificationAudio", () => {
  it("resumes a suspended context and plays a silent buffer", async () => {
    const sound = await setup("AudioContext")
    sound.unlockNotificationAudio()
    const ctx = FakeAudioContext.instances[0]
    ctx.state = "suspended"
    sound.unlockNotificationAudio()
    await Promise.resolve()
    await Promise.resolve()
    expect(ctx.resume).toHaveBeenCalled()
    expect(ctx.createBufferSource).toHaveBeenCalled()
  })
})
