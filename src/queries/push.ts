/**
 * JMAP push → React Query invalidation bridge.
 *
 * Mounted once by the app shell. Every server push event invalidates the
 * queries for the changed entity type so the UI refreshes live (new mail
 * arriving, another client moving messages, …).
 */

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { getJmapClient } from "../services/jmap.service"
import { qk } from "./keys"
import { ACCOUNT_KEY } from "./client"

export function useJmapPush(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    let subscription: { close: () => void } | null = null
    let cancelled = false

    void getJmapClient()
      .then((client) => {
        if (cancelled) return
        subscription = client.startPush((payload) => {
          const type = payload.type as string | undefined
          switch (type) {
            case "Email":
              void queryClient.invalidateQueries({
                queryKey: [ACCOUNT_KEY, "emails"],
              })
              void queryClient.invalidateQueries({
                queryKey: [ACCOUNT_KEY, "thread"],
              })
              void queryClient.invalidateQueries({
                queryKey: [ACCOUNT_KEY, "search"],
              })
              void queryClient.invalidateQueries({
                queryKey: [ACCOUNT_KEY, "thread-emails"],
              })
              // Counts on mailboxes change with email events too.
              void queryClient.invalidateQueries({ queryKey: qk.mailboxes() })
              break
            case "Mailbox":
              void queryClient.invalidateQueries({ queryKey: qk.mailboxes() })
              break
            case "CalendarEvent":
              void queryClient.invalidateQueries({
                queryKey: [ACCOUNT_KEY, "events"],
              })
              break
            case "Contact":
              void queryClient.invalidateQueries({
                queryKey: [ACCOUNT_KEY, "contacts"],
              })
              break
            case "FileNode":
              void queryClient.invalidateQueries({
                queryKey: [ACCOUNT_KEY, "files"],
              })
              break
          }
        })
      })
      .catch(() => {
        // Push is best-effort; polling/invalidation still apply.
      })

    return () => {
      cancelled = true
      subscription?.close()
    }
  }, [queryClient])
}
