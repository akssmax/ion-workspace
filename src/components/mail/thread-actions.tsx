/**
 * Shared runner for the per-thread actions shown in both the mail list and the
 * reading-pane toolbar. The mutations are created once by the provider so rows
 * don't each mount six React Query observers; every surface gets identical
 * mutation, toast and undo behaviour.
 */

import { createContext, useCallback, useContext, useMemo } from "react"
import type { ReactNode } from "react"
import { runWithUndo } from "@/lib/undo-toast"
import {
  useArchiveEmails,
  useMarkRead,
  useMarkStarred,
  useRestoreEmails,
  useTrashEmails,
  useUnarchiveEmails,
} from "@/queries/mail"

export type ThreadActionIntent =
  | "archive"
  | "unarchive"
  | "trash"
  | "restore"
  | "read"
  | "unread"
  | "star"
  | "unstar"

interface ThreadActionsValue {
  run: (intent: ThreadActionIntent, threadId: string) => void
  busy: boolean
}

const ThreadActionsContext = createContext<ThreadActionsValue | null>(null)

export function ThreadActionsProvider({ children }: { children: ReactNode }) {
  const archive = useArchiveEmails()
  const unarchive = useUnarchiveEmails()
  const trash = useTrashEmails()
  const restore = useRestoreEmails()
  const read = useMarkRead()
  const starred = useMarkStarred()
  const busy =
    archive.isPending ||
    unarchive.isPending ||
    trash.isPending ||
    restore.isPending ||
    read.isPending ||
    starred.isPending

  const run = useCallback(
    (intent: ThreadActionIntent, threadId: string) => {
      if (busy) return
      const ids = [threadId]
      switch (intent) {
        case "archive":
          runWithUndo(archive.mutateAsync(ids), {
            loading: "Archiving…",
            success: "Conversation archived",
            error: "Couldn't archive the conversation.",
            onUndo: () => unarchive.mutateAsync(ids),
            undoError: "Couldn't unarchive the conversation.",
          })
          break
        case "unarchive":
          runWithUndo(unarchive.mutateAsync(ids), {
            loading: "Unarchiving…",
            success: "Conversation unarchived",
            error: "Couldn't unarchive the conversation.",
            onUndo: () => archive.mutateAsync(ids),
            undoError: "Couldn't re-archive the conversation.",
          })
          break
        case "trash":
          runWithUndo(trash.mutateAsync(ids), {
            loading: "Moving to Bin…",
            success: "Conversation moved to Bin.",
            error: "Couldn't move the conversation to Bin.",
            onUndo: () => restore.mutateAsync(ids),
            undoError: "Couldn't restore the conversation.",
          })
          break
        case "restore":
          runWithUndo(restore.mutateAsync(ids), {
            loading: "Restoring…",
            success: "Conversation restored to inbox",
            error: "Couldn't restore the conversation.",
            onUndo: () => trash.mutateAsync(ids),
            undoError: "Couldn't move the conversation to Bin.",
          })
          break
        case "read":
          runWithUndo(read.mutateAsync({ ids, read: true }), {
            loading: "Marking as read…",
            success: "Marked as read",
            error: "Couldn't update the conversation.",
            onUndo: () => read.mutateAsync({ ids, read: false }),
            undoError: "Couldn't update the conversation.",
          })
          break
        case "unread":
          runWithUndo(read.mutateAsync({ ids, read: false }), {
            loading: "Marking as unread…",
            success: "Marked as unread",
            error: "Couldn't update the conversation.",
            onUndo: () => read.mutateAsync({ ids, read: true }),
            undoError: "Couldn't update the conversation.",
          })
          break
        case "star":
          runWithUndo(starred.mutateAsync({ ids, starred: true }), {
            loading: "Starring…",
            success: "Starred",
            error: "Couldn't update the conversation.",
          })
          break
        case "unstar":
          runWithUndo(starred.mutateAsync({ ids, starred: false }), {
            loading: "Removing star…",
            success: "Removed star",
            error: "Couldn't update the conversation.",
          })
          break
      }
    },
    [busy, archive, unarchive, trash, restore, read, starred]
  )

  const value = useMemo(() => ({ run, busy }), [run, busy])
  return (
    <ThreadActionsContext.Provider value={value}>
      {children}
    </ThreadActionsContext.Provider>
  )
}

/** Bind the shared runner to a single thread. */
export function useThreadActionRunner(threadId: string) {
  const context = useContext(ThreadActionsContext)
  if (!context) {
    throw new Error(
      "useThreadActionRunner must be used within a ThreadActionsProvider."
    )
  }
  const { run, busy } = context
  const runForThread = useCallback(
    (intent: ThreadActionIntent) => run(intent, threadId),
    [run, threadId]
  )
  return { run: runForThread, busy }
}
