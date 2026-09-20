import { describe, expect, test } from "vitest"
import { accentForKey } from "./accents"
import {
  DEFAULT_TAG_ICON,
  TAG_ICONS,
  isTagIconName,
  resolveTagAppearance,
  tagIcon,
} from "./tag-appearance"

describe("tag appearance", () => {
  test("falls back to a stable icon and accent", () => {
    const resolved = resolveTagAppearance(undefined, "mailbox-1")
    expect(resolved.icon).toBe(DEFAULT_TAG_ICON)
    expect(resolved.color).toBe(accentForKey("mailbox-1"))
    expect(resolved.Icon).toBe(TAG_ICONS[DEFAULT_TAG_ICON])
  })

  test("keeps a stored color and icon", () => {
    const resolved = resolveTagAppearance(
      { color: "violet", icon: "rocket" },
      "mailbox-1"
    )
    expect(resolved.color).toBe("violet")
    expect(resolved.icon).toBe("rocket")
    expect(resolved.Icon).toBe(TAG_ICONS.rocket)
  })

  test("ignores unknown stored values", () => {
    const resolved = resolveTagAppearance(
      { color: "not-a-color", icon: "not-an-icon" },
      "mailbox-1"
    )
    expect(resolved.color).toBe(accentForKey("mailbox-1"))
    expect(resolved.icon).toBe(DEFAULT_TAG_ICON)
  })

  test("validates icon names", () => {
    expect(isTagIconName("heart")).toBe(true)
    expect(isTagIconName("nope")).toBe(false)
    expect(isTagIconName(null)).toBe(false)
    expect(tagIcon("nope")).toBe(TAG_ICONS[DEFAULT_TAG_ICON])
  })
})
