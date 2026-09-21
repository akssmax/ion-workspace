/**
 * Notifications bridge — invisible component that runs the mail and calendar
 * notification sources while the feature is enabled. Mounted once by the app
 * shell.
 */

import { useEffect } from "react"
import { useFeatureFlag } from "@/features/flags"
import { useMailNotifications } from "./use-mail-notifications"
import { useCalendarNotifications } from "./use-calendar-notifications"
import { unlockNotificationAudio } from "./sound"

export function NotificationsBridge() {
  const enabled = useFeatureFlag("system.notifications")

  // Browsers keep the AudioContext suspended until a user gesture; unlock it
  // on the first interaction so later notification tones can actually play.
  useEffect(() => {
    if (!enabled) return
    const unlock = () => unlockNotificationAudio()
    const events = ["pointerdown", "keydown", "touchstart"] as const
    for (const event of events) {
      window.addEventListener(event, unlock, { passive: true })
    }
    return () => {
      for (const event of events) {
        window.removeEventListener(event, unlock)
      }
    }
  }, [enabled])

  useMailNotifications(enabled)
  useCalendarNotifications(enabled)
  return null
}
