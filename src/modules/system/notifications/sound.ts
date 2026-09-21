/**
 * Notification tones, synthesized with the Web Audio API.
 *
 * No binary assets: each preset is a short oscillator envelope, so the tones
 * work offline and can be previewed instantly. Playback is best-effort — a
 * blocked/suspended AudioContext never breaks a notification.
 */

import type { NotificationSoundId } from "@/lib/notifications"

let context: AudioContext | null = null

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  const Ctor = (window as unknown as { AudioContext?: typeof AudioContext })
    .AudioContext
  if (!Ctor) return null
  try {
    if (!context) context = new Ctor()
    return context
  } catch {
    return null
  }
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
  playNotificationSound(sound)
}
