/**
 * Notification delivery core.
 *
 * Chooses the right surface for an alert: a system notification when the tab
 * is in the background, an in-app toast otherwise. Handles dedupe, click
 * routing, and optional sound. Framework-agnostic helpers live here so the
 * mail/calendar hooks stay thin.
 */

import { toast } from "sonner"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useMailStore } from "@/stores/mail.store"
import { useCalendarStore } from "@/stores/calendar.store"
import { playNotificationSound } from "./sound"
import type { NotificationSoundId } from "@/lib/notifications"

export interface NotifyInput {
  /** Stable dedupe key (usually the email/occurrence id). */
  id: string
  title: string
  body: string
  /** Optional tone; omit or `none` to stay silent. */
  sound?: NotificationSoundId
  onClick?: () => void
}

const notifiedIds = new Set<string>()
const MAX_TRACKED = 500

export function alreadyNotified(id: string): boolean {
  return notifiedIds.has(id)
}

export function markNotified(id: string): void {
  notifiedIds.add(id)
  if (notifiedIds.size > MAX_TRACKED) {
    // Drop the oldest entries; insertion order is stable in a Set.
    const excess = notifiedIds.size - MAX_TRACKED
    let removed = 0
    for (const value of notifiedIds) {
      notifiedIds.delete(value)
      if (++removed >= excess) break
    }
  }
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window
}

export function notificationPermission(): NotificationPermission {
  if (!notificationsSupported()) return "denied"
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied"
  try {
    return await Notification.requestPermission()
  } catch {
    return "denied"
  }
}

export function focusWindow(): void {
  try {
    window.focus()
  } catch {
    // focusing is best-effort
  }
}

/** Open a conversation in the mail app. */
export function openThread(threadId: string): void {
  useWorkspaceStore.getState().setApp("mail")
  useMailStore.getState().setFocusedThread(threadId)
  focusWindow()
}

/** Open a calendar event in the calendar app. */
export function openEvent(eventId: string): void {
  useCalendarStore.getState().setSelectedEvent(eventId)
  useWorkspaceStore.getState().setApp("calendar")
  focusWindow()
}

/**
 * Deliver an alert on the appropriate surface and mark it as notified.
 * Returns true when something was shown.
 */
export function deliver(input: NotifyInput): boolean {
  if (alreadyNotified(input.id)) return false

  const systemAvailable =
    notificationsSupported() &&
    Notification.permission === "granted" &&
    typeof document !== "undefined" &&
    document.hidden

  if (systemAvailable) {
    try {
      const notification = new Notification(input.title, {
        body: input.body,
        tag: input.id,
        icon: "/logo.svg",
      })
      notification.onclick = () => {
        focusWindow()
        input.onClick?.()
        notification.close()
      }
    } catch {
      // fall through to a toast
      toastWithAction(input)
    }
  } else {
    toastWithAction(input)
  }

  if (input.sound && input.sound !== "none") {
    playNotificationSound(input.sound)
  }
  markNotified(input.id)
  return true
}

function toastWithAction(input: NotifyInput): void {
  toast(input.title, {
    description: input.body,
    action: input.onClick
      ? { label: "Open", onClick: () => input.onClick?.() }
      : undefined,
  })
}
