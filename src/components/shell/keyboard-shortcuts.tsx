/**
 * Global keyboard shortcut handler (Gmail-style conventions).
 */

import { useEffect, useRef } from "react"
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

  // Mutations and store values get fresh identities each render; keep the
  // handler bound once and read the latest from a ref.
  const latest = useRef({
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
  })
  latest.current = {
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
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const s = latest.current

      const target = e.target as HTMLElement | null
      const editing =
        target &&
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)
      const isContentEditable = target?.isContentEditable === true

      // The palette shortcut works even while typing.
      if (shortcutMatches(e, "cmd+k") || shortcutMatches(e, "ctrl+k")) {
        e.preventDefault()
        s.setPaletteOpen(true)
        return
      }

      // Don't hijack typing keys while the user is editing text.
      if (editing || isContentEditable) return

      const match = (id: string) => {
        const def = SHORTCUTS.find((s2) => s2.id === id)
        if (!def) return false
        return (
          shortcutMatches(e, def.keys) ||
          (def.macKeys ? shortcutMatches(e, def.macKeys) : false)
        )
      }

      const ids = s.focusedThreadId
        ? new Set([s.focusedThreadId, ...s.selectedThreadIds])
        : new Set(s.selectedThreadIds)

      if (match("compose") && s.app === "mail") {
        e.preventDefault()
        s.openCompose({ open: true, mode: "new" })
        return
      }
      if (match("search") && s.app === "mail") {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent("workspace:focus-search"))
        return
      }
      if (match("refresh") && s.app === "mail") {
        e.preventDefault()
        void s.queryClient.invalidateQueries({ queryKey: ["acc", "emails"] })
        return
      }
      if (match("mark-read") && s.app === "mail") {
        if (ids.size) void s.markRead.mutateAsync({ ids: [...ids], read: true })
        return
      }
      if (match("mark-unread") && s.app === "mail") {
        if (ids.size)
          void s.markRead.mutateAsync({ ids: [...ids], read: false })
        return
      }
      if (match("archive") && s.app === "mail") {
        if (ids.size) void s.archive.mutateAsync([...ids])
        return
      }
      if (match("move-trash") && s.app === "mail") {
        if (ids.size) void s.trash.mutateAsync([...ids])
        return
      }
      if (match("star") && s.app === "mail") {
        if (ids.size)
          void s.markStarred.mutateAsync({ ids: [...ids], starred: true })
        return
      }
      if (match("reply") && s.app === "mail") {
        e.preventDefault()
        s.openCompose({ open: true, mode: "reply" })
        return
      }
      if (match("reply-all") && s.app === "mail") {
        e.preventDefault()
        s.openCompose({ open: true, mode: "reply-all" })
        return
      }
      if (match("forward") && s.app === "mail") {
        e.preventDefault()
        s.openCompose({ open: true, mode: "forward" })
        return
      }
      if (match("today") && s.app === "calendar") {
        e.preventDefault()
        s.goToday()
        return
      }
      if ((match("prev-day") || match("next-day")) && s.app === "calendar") {
        e.preventDefault()
        s.stepCalendar(match("next-day") ? 1 : -1)
        return
      }
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return null
}
