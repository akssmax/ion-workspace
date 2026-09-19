/**
 * Global keyboard shortcut handler (Gmail-style conventions).
 */

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { SHORTCUTS, shortcutMatches } from "@/lib/keyboard"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useMailStore } from "@/stores/mail.store"
import { useComposerStore } from "@/stores/composer.store"
import { useCalendarStore } from "@/stores/calendar.store"
import {
  useArchiveEmails,
  useMarkRead,
  useMarkStarred,
  useTrashEmails,
} from "@/queries/mail"

export function KeyboardShortcuts() {
  const app = useWorkspaceStore((s) => s.app)
  const setPaletteOpen = useWorkspaceStore((s) => s.setPaletteOpen)
  const focusedThreadId = useMailStore((s) => s.focusedThreadId)
  const selectedThreadIds = useMailStore((s) => s.selectedThreadIds)
  const openCompose = useComposerStore((s) => s.openCompose)
  const stepCalendar = useCalendarStore((s) => s.step)
  const goToday = useCalendarStore((s) => s.goToday)
  const markRead = useMarkRead()
  const markStarred = useMarkStarred()
  const archive = useArchiveEmails()
  const trash = useTrashEmails()
  const queryClient = useQueryClient()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const editing =
        target &&
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)
      const isContentEditable = target?.isContentEditable === true

      // The palette shortcut works even while typing.
      if (shortcutMatches(e, "cmd+k") || shortcutMatches(e, "ctrl+k")) {
        e.preventDefault()
        setPaletteOpen(true)
        return
      }

      // Don't hijack typing keys while the user is editing text.
      if (editing || isContentEditable) return

      const match = (id: string) => {
        const def = SHORTCUTS.find((s) => s.id === id)
        if (!def) return false
        return (
          shortcutMatches(e, def.keys) ||
          (def.macKeys ? shortcutMatches(e, def.macKeys) : false)
        )
      }

      const ids = focusedThreadId
        ? new Set([focusedThreadId, ...selectedThreadIds])
        : new Set(selectedThreadIds)

      if (match("compose") && app === "mail") {
        e.preventDefault()
        openCompose({ open: true, mode: "new" })
        return
      }
      if (match("search") && app === "mail") {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent("workspace:focus-search"))
        return
      }
      if (match("refresh") && app === "mail") {
        e.preventDefault()
        void queryClient.invalidateQueries({ queryKey: ["acc", "emails"] })
        return
      }
      if (match("mark-read") && app === "mail") {
        if (ids.size) void markRead.mutateAsync({ ids: [...ids], read: true })
        return
      }
      if (match("mark-unread") && app === "mail") {
        if (ids.size) void markRead.mutateAsync({ ids: [...ids], read: false })
        return
      }
      if (match("archive") && app === "mail") {
        if (ids.size) void archive.mutateAsync([...ids])
        return
      }
      if (match("move-trash") && app === "mail") {
        if (ids.size) void trash.mutateAsync([...ids])
        return
      }
      if (match("star") && app === "mail") {
        if (ids.size)
          void markStarred.mutateAsync({ ids: [...ids], starred: true })
        return
      }
      if (match("reply") && app === "mail") {
        e.preventDefault()
        openCompose({ open: true, mode: "reply" })
        return
      }
      if (match("reply-all") && app === "mail") {
        e.preventDefault()
        openCompose({ open: true, mode: "reply-all" })
        return
      }
      if (match("forward") && app === "mail") {
        e.preventDefault()
        openCompose({ open: true, mode: "forward" })
        return
      }
      if (match("today") && app === "calendar") {
        e.preventDefault()
        goToday()
        return
      }
      if ((match("prev-day") || match("next-day")) && app === "calendar") {
        e.preventDefault()
        stepCalendar(match("next-day") ? 1 : -1)
        return
      }
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [
    app,
    focusedThreadId,
    selectedThreadIds,
    setPaletteOpen,
    openCompose,
    stepCalendar,
    goToday,
    markRead,
    markStarred,
    archive,
    trash,
    queryClient,
  ])

  return null
}
