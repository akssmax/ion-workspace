/**
 * Notification tones, synthesized with the Web Audio API.
 *
 * No binary assets: each preset is a short oscillator envelope, so the tones
 * work offline and can be previewed instantly. Playback is best-effort — a
 * blocked/suspended AudioContext never breaks a notification.
 *
 * Browsers block audio until a user gesture unlocks the AudioContext, so the
 * first gesture anywhere in the app should call `unlockNotificationAudio()`.
 * Otherwise the context is created already-suspended and `resume()` is
 * rejected, which is why notifications can arrive silently.
 */

import type { NotificationSoundId } from "@/lib/notifications"

type AudioContextCtor = new () => AudioContext

let context: AudioContext | null = null

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null
  const candidate = window as unknown as {
    AudioContext?: AudioContextCtor
    webkitAudioContext?: AudioContextCtor
  }
  return candidate.AudioContext ?? candidate.webkitAudioContext ?? null
}

function audioContext(): AudioContext | null {
  const Ctor = audioContextCtor()
  if (!Ctor) return null
  try {
    if (!context) context = new Ctor()
    return context
  } catch {
    return null
  }
}

/**
 * Create/resume the shared AudioContext from within a user gesture so later
 * notification sounds can play. Safe to call repeatedly.
 */
export function unlockNotificationAudio(): void {
  const ctx = audioContext()
  if (!ctx) return
  const resume = ctx.state === "suspended" ? ctx.resume().catch(() => {}) : null
  void (resume ?? Promise.resolve()).then(() => {
    if (ctx.state !== "running") return
    // Play a zero-length buffer to fully unlock iOS/Safari.
    try {
      const source = ctx.createBufferSource()
      source.buffer = ctx.createBuffer(1, 1, 22050)
      source.connect(ctx.destination)
      source.start(0)
    } catch {
      // best-effort unlock
    }
  })
}

function blip(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  peak: number
): void {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = "sine"
  oscillator.frequency.setValueAtTime(frequency, startAt)
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
  oscillator.connect(gain).connect(ctx.destination)
  oscillator.start(startAt)
  oscillator.stop(startAt + duration + 0.02)
}

/** Play a tone. Safe to call without a prior user gesture (no-op if blocked). */
export function playNotificationSound(sound: NotificationSoundId): void {
  if (sound === "none") return
  const ctx = audioContext()
  if (!ctx) return
  const run = () => {
    if (ctx.state !== "running") return
    const now = ctx.currentTime + 0.01
    if (sound === "beep") {
      blip(ctx, 880, now, 0.14, 0.18)
    } else if (sound === "chime") {
      blip(ctx, 660, now, 0.18, 0.15)
      blip(ctx, 990, now + 0.12, 0.22, 0.13)
    } else {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(420, now)
      oscillator.frequency.exponentialRampToValueAtTime(180, now + 0.09)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
      oscillator.connect(gain).connect(ctx.destination)
      oscillator.start(now)
      oscillator.stop(now + 0.14)
    }
  }
  if (ctx.state === "suspended") {
    // Only succeeds inside a user gesture; otherwise stay silent.
    void ctx
      .resume()
      .then(run)
      .catch(() => {})
  } else {
    run()
  }
}

/** Preview a tone from settings (called on a user gesture). */
export function previewNotificationSound(sound: NotificationSoundId): void {
  unlockNotificationAudio()
  playNotificationSound(sound)
}
