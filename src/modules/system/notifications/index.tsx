/**
 * system.notifications feature.
 *
 * Registers its settings section and exports the bridge the app shell mounts.
 * The feature definition itself lives in `src/features/catalog.ts`.
 */

import { Bell } from "lucide-react"
import { settingsNavSections } from "@/features/contributions"
import { NotificationsSettings } from "./NotificationsSettings"
import { NotificationsBridge } from "./bridge"

settingsNavSections.register("system.notifications", {
  id: "notifications",
  title: "Notifications",
  description: "Email, calendar and background alerts",
  group: "Workspace",
  icon: <Bell className="size-4" />,
  component: NotificationsSettings,
})

export { NotificationsBridge, NotificationsSettings }
export { useMailNotifications } from "./use-mail-notifications"
export { useCalendarNotifications } from "./use-calendar-notifications"
