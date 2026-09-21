/**
 * Notifications bridge — invisible component that runs the mail and calendar
 * notification sources while the feature is enabled. Mounted once by the app
 * shell.
 */

import { useFeatureFlag } from "@/features/flags"
import { useMailNotifications } from "./use-mail-notifications"
import { useCalendarNotifications } from "./use-calendar-notifications"

export function NotificationsBridge() {
  const enabled = useFeatureFlag("system.notifications")
  useMailNotifications(enabled)
  useCalendarNotifications(enabled)
  return null
}
