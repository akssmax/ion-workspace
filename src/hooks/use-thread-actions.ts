/**
 * Shared runner for the per-thread actions shown in both the mail list and the
 * reading-pane toolbar. Every surface uses this hook so the mutation, toast and
 * undo behaviour is identical everywhere.
 */

import { useCallback } from "react"
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

export function useThreadActionRunner(threadId: string) {
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
    (intent: ThreadActionIntent) => {
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
    [busy, threadId, archive, unarchive, trash, restore, read, starred]
  )

  return { run, busy }
}
