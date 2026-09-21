/**
 * Notification preferences (Gmail / Bulwark inspired).
 *
 * Pure model shared by the client UI and the server preferences store, so both
 * sides agree on valid values and defaults. Background/Web Push activation is
 * per-device and lives client-side; these values are per-user.
 *
 * - `emailEnabled` / `emailSound`       — new-mail alerts and their tone.
 * - `calendarEnabled` / `calendarSound` — event reminders and their tone.
 * - `sound`                             — the tone used by both channels.
 * - `parseInvitations`                  — detect calendar invites in mail
 *   (gate only; parsing lands in a later phase).
 */

export type NotificationSoundId = "beep" | "chime" | "pop" | "none"

export interface NotificationPreferences {
  emailEnabled: boolean
  emailSound: boolean
  calendarEnabled: boolean
  calendarSound: boolean
  sound: NotificationSoundId
  parseInvitations: boolean
}

export const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  emailEnabled: true,
  emailSound: true,
  calendarEnabled: true,
  calendarSound: true,
  sound: "beep",
  parseInvitations: true,
}

export const NOTIFICATION_SOUNDS: {
  value: NotificationSoundId
  label: string
}[] = [
  { value: "beep", label: "Default (Beep)" },
  { value: "chime", label: "Chime" },
  { value: "pop", label: "Pop" },
  { value: "none", label: "None" },
]

const SOUNDS: readonly string[] = ["beep", "chime", "pop", "none"]

export function isNotificationSound(
  value: unknown
): value is NotificationSoundId {
  return typeof value === "string" && SOUNDS.includes(value)
}

/**
 * Merge partial/stored notification prefs over the defaults. Unknown or
 * mistyped values fall back to the default instead of breaking alerts.
 */
export function resolveNotificationPrefs(
  raw?: {
    emailEnabled?: unknown
    emailSound?: unknown
    calendarEnabled?: unknown
    calendarSound?: unknown
    sound?: unknown
    parseInvitations?: unknown
  } | null
): NotificationPreferences {
  return {
    emailEnabled: boolean(
      raw?.emailEnabled,
      DEFAULT_NOTIFICATIONS.emailEnabled
    ),
    emailSound: boolean(raw?.emailSound, DEFAULT_NOTIFICATIONS.emailSound),
    calendarEnabled: boolean(
      raw?.calendarEnabled,
      DEFAULT_NOTIFICATIONS.calendarEnabled
    ),
    calendarSound: boolean(
      raw?.calendarSound,
      DEFAULT_NOTIFICATIONS.calendarSound
    ),
    sound: isNotificationSound(raw?.sound)
      ? raw.sound
      : DEFAULT_NOTIFICATIONS.sound,
    parseInvitations: boolean(
      raw?.parseInvitations,
      DEFAULT_NOTIFICATIONS.parseInvitations
    ),
  }
}

function boolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}
