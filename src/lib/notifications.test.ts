import { describe, expect, it } from "vitest"
import {
  DEFAULT_NOTIFICATIONS,
  resolveNotificationPrefs,
} from "./notifications"

describe("resolveNotificationPrefs", () => {
  it("returns defaults for missing input", () => {
    expect(resolveNotificationPrefs()).toEqual(DEFAULT_NOTIFICATIONS)
    expect(resolveNotificationPrefs(null)).toEqual(DEFAULT_NOTIFICATIONS)
    expect(resolveNotificationPrefs({})).toEqual(DEFAULT_NOTIFICATIONS)
  })

  it("accepts a fully valid set of preferences", () => {
    expect(
      resolveNotificationPrefs({
        emailEnabled: false,
        emailSound: false,
        calendarEnabled: false,
        calendarSound: true,
        sound: "chime",
        parseInvitations: false,
      })
    ).toEqual({
      emailEnabled: false,
      emailSound: false,
      calendarEnabled: false,
      calendarSound: true,
      sound: "chime",
      parseInvitations: false,
    })
  })

  it("merges partial preferences over defaults", () => {
    expect(resolveNotificationPrefs({ emailEnabled: false })).toEqual({
      ...DEFAULT_NOTIFICATIONS,
      emailEnabled: false,
    })
  })

  it("falls back for non-boolean toggles", () => {
    expect(resolveNotificationPrefs({ emailEnabled: "yes" }).emailEnabled).toBe(
      DEFAULT_NOTIFICATIONS.emailEnabled
    )
    expect(resolveNotificationPrefs({ emailSound: 0 }).emailSound).toBe(
      DEFAULT_NOTIFICATIONS.emailSound
    )
  })

  it("falls back for unknown sounds", () => {
    expect(resolveNotificationPrefs({ sound: "siren" }).sound).toBe(
      DEFAULT_NOTIFICATIONS.sound
    )
    expect(resolveNotificationPrefs({ sound: null }).sound).toBe(
      DEFAULT_NOTIFICATIONS.sound
    )
    expect(resolveNotificationPrefs({ sound: "pop" }).sound).toBe("pop")
  })
})
