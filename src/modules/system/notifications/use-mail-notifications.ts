/**
 * New-mail notifications.
 *
 * Subscribes to normalized JMAP push events, resolves newly created messages
 * via `Email/changes` + `Email/get` (JMAP-native, no polling), and delivers a
 * notification for unread Inbox mail.
 */

import { useEffect, useRef } from "react"
import {
  useMailboxes,
  useEmailChanges,
  useFetchEmailsByIds,
} from "@/queries/mail"
import { useNotificationPrefs } from "@/queries/preferences"
import { usePushSubscription } from "@/queries/push"
import { useMailStore } from "@/stores/mail.store"
import { senderName } from "@/lib/html"
import type { EmailProperties } from "@/jmap/types/mail"
import { deliver, openThread } from "./notify-core"

const NOTIFY_PROPERTIES = [
  "threadId",
  "mailboxIds",
  "keywords",
  "from",
  "subject",
  "preview",
  "receivedAt",
]

export function useMailNotifications(enabled: boolean): void {
  const prefs = useNotificationPrefs()
  const mailboxes = useMailboxes()
  const inboxId = mailboxes.data?.find(
    (mailbox) => mailbox.role === "inbox"
  )?.id
  const focusedThreadId = useMailStore((s) => s.focusedThreadId)
  const changes = useEmailChanges()
  const fetchEmails = useFetchEmailsByIds()

  const stateRef = useRef<string | undefined>(undefined)
  const seeded = useRef(false)
  const polling = useRef(false)

  // Capture the current state once so only mail arriving after load alerts.
  useEffect(() => {
    if (!enabled || seeded.current) return
    seeded.current = true
    void changes
      .mutateAsync(undefined)
      .then((res) => {
        stateRef.current = res.newState
      })
      .catch(() => {})
  }, [enabled, changes])

  async function poll(): Promise<void> {
    if (!enabled || polling.current || !inboxId) return
    polling.current = true
    try {
      const res = await changes.mutateAsync(stateRef.current)
      stateRef.current = res.newState
      const ids = res.created.filter((id) => !!id)
      if (!ids.length) return
      const emails = await fetchEmails.mutateAsync({
        ids,
        properties: NOTIFY_PROPERTIES,
      })
      for (const email of emails) notifyEmail(email, inboxId, focusedThreadId)
    } catch {
      // Notifications are best-effort; the next push retries.
    } finally {
      polling.current = false
    }
  }

  const mailEnabled = enabled && prefs.emailEnabled
  usePushSubscription(({ entity }) => {
    if (entity !== "Email" || !mailEnabled) return
    void poll()
  })

  function notifyEmail(
    email: EmailProperties,
    inbox: string,
    focused: string | null
  ): void {
    if (!email.mailboxIds[inbox]) return
    if (
      email.keywords?.$seen ||
      email.keywords?.$draft ||
      email.keywords?.$junk
    )
      return
    if (focused && email.threadId === focused) return
    deliver({
      id: email.id,
      title: senderName(email) || "New message",
      body: email.subject || email.preview || "(no subject)",
      sound: prefs.emailSound ? prefs.sound : undefined,
      onClick: () => openThread(email.threadId),
    })
  }
}
