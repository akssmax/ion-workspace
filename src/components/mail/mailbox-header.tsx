/**
 * Mailbox header — bulk actions for the visible conversation list.
 *
 * Sits on top of the email rows (not in the app chrome). Select-all, read,
 * star, archive, trash, more (label/move and extras), clear, and refresh
 * live here so the mailbox name + search can stay in the toolbar above.
 */

import { useState } from "react"
import {
  Archive,
  Mail,
  MailOpen,
  MoreHorizontal,
  RefreshCw,
  Star,
  StarOff,
  Trash2,
  RotateCcw,
  ShieldAlert,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "cn"
import { useQueryClient } from "@tanstack/react-query"
import { qk } from "@/queries/keys"
import { ACCOUNT_KEY } from "@/queries/client"
import { useMailStore } from "@/stores/mail.store"
import {
  useArchiveEmails,
  useMailboxes,
  useMarkRead,
  useMarkStarred,
  useTrashEmails,
  useRestoreEmails,
  usePermanentlyDeleteEmails,
  useReportJunk,
  useMarkNotJunk,
} from "@/queries/mail"
import { useFeatureFlag } from "@/features/flags"
import { LabelMenu } from "@/modules/mail/labels"
import { MoveMenu } from "@/modules/mail/move/move-menu"
import {
  TrashConfirmDialog,
  trashIconButtonClassName,
} from "./trash-confirm-dialog"

export function MailboxHeader() {
  const selectedThreadIds = useMailStore((s) => s.selectedThreadIds)
  const visibleThreadIds = useMailStore((s) => s.visibleThreadIds)
  const selectThreads = useMailStore((s) => s.selectThreads)
  const clearSelection = useMailStore((s) => s.clearSelection)
  const activeMailboxId = useMailStore((s) => s.activeMailboxId)
  const { data: mailboxes } = useMailboxes()
  const mailbox = mailboxes?.find((m) => m.id === activeMailboxId)
  const queryClient = useQueryClient()

  const archive = useArchiveEmails()
  const trash = useTrashEmails()
  const restore = useRestoreEmails()
  const permanentlyDelete = usePermanentlyDeleteEmails()
  const reportJunk = useReportJunk()
  const markNotJunk = useMarkNotJunk()
  const starred = useMarkStarred()
  const read = useMarkRead()
  const [trashConfirmOpen, setTrashConfirmOpen] = useState(false)

  const hasSelection = selectedThreadIds.length > 0
  const allVisibleSelected =
    visibleThreadIds.length > 0 &&
    visibleThreadIds.every((id) => selectedThreadIds.includes(id))
  const isTrash = mailbox?.role === "trash"
  const isJunk = mailbox?.role === "junk"
  const labelsEnabled = useFeatureFlag("mail.labels")

  return (
    <header
      aria-label="Mailbox header"
      className={cn(
        "flex h-10 min-w-0 shrink-0 items-center overflow-hidden border-b px-2",
        hasSelection && "bg-muted/40"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center overflow-hidden">
        {isTrash ? <Button
          variant="ghost"
          size="icon-sm"
          disabled={!hasSelection}
          onClick={() => void restore.mutateAsync([...selectedThreadIds])}
          aria-label="Restore to inbox"
        ><RotateCcw className="size-4" /></Button> : null}
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="flex shrink-0 items-center px-1">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) =>
                    checked
                      ? selectThreads([...visibleThreadIds])
                      : clearSelection()
                  }
                  disabled={visibleThreadIds.length === 0}
                  aria-label="Select all"
                />
              </span>
            }
          >
            <span />
          </TooltipTrigger>
          <TooltipContent>Select all</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!hasSelection}
                onClick={() =>
                  void read.mutateAsync({
                    ids: [...selectedThreadIds],
                    read: true,
                  })
                }
                aria-label="Mark as read"
              >
                <Mail className="size-4" />
              </Button>
            }
          >
            <span />
          </TooltipTrigger>
          <TooltipContent>Mark as read</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!hasSelection}
                onClick={() =>
                  void starred.mutateAsync({
                    ids: [...selectedThreadIds],
                    starred: true,
                  })
                }
                aria-label="Mark as starred"
              >
                <Star className="size-4" />
              </Button>
            }
          >
            <span />
          </TooltipTrigger>
          <TooltipContent>Star</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!hasSelection || isTrash}
                onClick={() => void archive.mutateAsync([...selectedThreadIds])}
                aria-label="Archive"
              >
                <Archive className="size-4" />
              </Button>
            }
          >
            <span />
          </TooltipTrigger>
          <TooltipContent>Archive</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!hasSelection}
                onClick={() => setTrashConfirmOpen(true)}
                aria-label={isTrash ? "Delete permanently" : "Move to trash"}
                className={trashIconButtonClassName}
              >
                <Trash2 className="size-4" />
              </Button>
            }
          >
            <span />
          </TooltipTrigger>
          <TooltipContent>{isTrash ? "Delete permanently" : "Move to trash"}</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!hasSelection}
                aria-label="More actions"
                title="More actions"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="start">
            {labelsEnabled ? (
              <LabelMenu
                threadIds={[...selectedThreadIds]}
                disabled={!hasSelection}
              />
            ) : null}
            <MoveMenu
              threadIds={[...selectedThreadIds]}
              disabled={!hasSelection}
            />
            <DropdownMenuItem
              onClick={() =>
                void read.mutateAsync({
                  ids: [...selectedThreadIds],
                  read: false,
                })
              }
            >
              <MailOpen className="size-3.5" />
              Mark as unread
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                void starred.mutateAsync({
                  ids: [...selectedThreadIds],
                  starred: false,
                })
              }
            >
              <StarOff className="size-3.5" />
              Remove star
            </DropdownMenuItem>
            {isJunk ? (
              <DropdownMenuItem onClick={() => void markNotJunk.mutateAsync([...selectedThreadIds])}>
                <ShieldAlert className="size-3.5" /> Not spam
              </DropdownMenuItem>
            ) : !isTrash ? (
              <>
                <DropdownMenuItem onClick={() => void reportJunk.mutateAsync({ ids: [...selectedThreadIds] })}>
                  <ShieldAlert className="size-3.5" /> Report spam
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void reportJunk.mutateAsync({ ids: [...selectedThreadIds], phishing: true })}>
                  <ShieldAlert className="size-3.5" /> Report phishing
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex shrink-0 items-center">
        {hasSelection ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={clearSelection}
                  aria-label="Clear selection"
                >
                  <X className="size-4" />
                </Button>
              }
            >
              <span />
            </TooltipTrigger>
            <TooltipContent>Clear selection</TooltipContent>
          </Tooltip>
        ) : null}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Refresh"
          onClick={() => {
            void queryClient.invalidateQueries({
              queryKey: [ACCOUNT_KEY, "emails"],
            })
            void queryClient.invalidateQueries({
              queryKey: [ACCOUNT_KEY, "thread"],
            })
            void queryClient.invalidateQueries({
              queryKey: [ACCOUNT_KEY, "search"],
            })
            void queryClient.invalidateQueries({ queryKey: qk.mailboxes() })
          }}
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>
      <TrashConfirmDialog
        open={trashConfirmOpen}
        onOpenChange={setTrashConfirmOpen}
        count={selectedThreadIds.length}
        permanent={isTrash}
        onConfirm={() => void (isTrash ? permanentlyDelete : trash).mutateAsync([...selectedThreadIds])}
      />
    </header>
  )
}
