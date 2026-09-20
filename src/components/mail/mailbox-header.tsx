/** Selection and page controls for the current mailbox query. */
import { useEffect, useState } from "react"
import { Archive, ChevronDown, ChevronLeft, ChevronRight, Mail, MailOpen, RefreshCw, RotateCcw, ShieldAlert, Star, StarOff, Trash2, X } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useMailStore } from "@/stores/mail.store"
import { useArchiveEmails, useUnarchiveEmails, useEmails, useMailboxes, useMarkRead, useMarkStarred, useTrashEmails, useRestoreEmails, usePermanentlyDeleteEmails, useEmptyTrash, useReportJunk, useMarkNotJunk, MAIL_PAGE_SIZE } from "@/queries/mail"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { parseSearch } from "@/lib/search"
import { useFeatureFlag } from "@/features/flags"
import { LabelMenu } from "@/modules/mail/labels"
import { MoveMenu } from "@/modules/mail/move/move-menu"
import { PermanentDeleteDialog } from "./permanent-delete-dialog"
import { MailListControls } from "./mail-list-controls"
import { SnoozeDialog } from "./snooze-dialog"
import type { MailQuickFilter, MailSort } from "@/lib/mail-list"

export function MailboxHeader({ mailboxId, query, page, onPageChange, sort, onSortChange, quickFilters, onQuickFiltersChange, sent }: { mailboxId: string | null; query: string; page: number; onPageChange: (page: number) => void; sort: MailSort; onSortChange: (sort: MailSort) => void; quickFilters: MailQuickFilter[]; onQuickFiltersChange: (filters: MailQuickFilter[]) => void; sent: boolean }) {
  const selectedThreadIds = useMailStore((s) => s.selectedThreadIds)
  const visibleThreadIds = useMailStore((s) => s.visibleThreadIds)
  const addThreads = useMailStore((s) => s.addThreads)
  const removeThreads = useMailStore((s) => s.removeThreads)
  const clearSelection = useMailStore((s) => s.clearSelection)
  const { data: mailboxes } = useMailboxes()
  const mailbox = mailboxes?.find((item) => item.id === mailboxId)
  const isTrash = mailbox?.role === "trash"
  const isArchive = mailbox?.role === "archive"
  const isJunk = mailbox?.role === "junk"
  const labelsEnabled = useFeatureFlag("mail.labels")
  const parsed = parseSearch(query)
  const scope = { mailboxId: parsed.mailboxNames.length ? undefined : (mailboxId ?? undefined), query: parsed.query || undefined, sort, sent, quickFilters }
  const results = useEmails(scope, page)
  const total = results.data?.total
  const position = results.data?.position ?? page * MAIL_PAGE_SIZE
  const count = results.data?.ids.length ?? 0
  const hasNext = total == null ? count === MAIL_PAGE_SIZE : position + count < total
  const allVisibleSelected = visibleThreadIds.length > 0 && visibleThreadIds.every((id) => selectedThreadIds.includes(id))
  const hasSelection = selectedThreadIds.length > 0
  const ids = [...selectedThreadIds]
  const queryClient = useQueryClient()
  const archive = useArchiveEmails()
  const unarchive = useUnarchiveEmails()
  const trash = useTrashEmails()
  const restore = useRestoreEmails()
  const permanentlyDelete = usePermanentlyDeleteEmails()
  const emptyTrash = useEmptyTrash()
  const reportJunk = useReportJunk()
  const markNotJunk = useMarkNotJunk()
  const starred = useMarkStarred()
  const read = useMarkRead()
  const [permanentDeleteOpen, setPermanentDeleteOpen] = useState(false)
  const [emptyTrashOpen, setEmptyTrashOpen] = useState(false)
  const [jumpOpen, setJumpOpen] = useState(false)
  const [jumpPage, setJumpPage] = useState("")

  // Deleting the final row on a page can leave it empty.
  useEffect(() => {
    if (!results.isPending && page > 0 && total != null && page * MAIL_PAGE_SIZE >= total)
      onPageChange(Math.max(0, Math.ceil(total / MAIL_PAGE_SIZE) - 1))
  }, [results.isPending, total, page, onPageChange])

  return <div className="shrink-0"><header aria-label="Mailbox header" className="flex h-11 min-w-0 shrink-0 items-center gap-1 border-b px-2">
    <Checkbox
      checked={allVisibleSelected}
      indeterminate={hasSelection && !allVisibleSelected}
      onCheckedChange={(checked) => checked ? addThreads(visibleThreadIds) : removeThreads(visibleThreadIds)}
      disabled={results.isPending || visibleThreadIds.length === 0}
      aria-label={allVisibleSelected ? "Deselect this page" : "Select this page"}
      className="mx-1"
    />
    {hasSelection ? <>
      <span className="shrink-0 px-1 text-xs text-muted-foreground tabular-nums" role="status">{ids.length} selected</span>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" aria-label="Bulk actions" />}>
          Actions <ChevronDown className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {isTrash ? <DropdownMenuItem onClick={() => restore.mutate(ids, { onSuccess: clearSelection })}><RotateCcw className="size-4" />Restore to inbox</DropdownMenuItem> : isArchive ? <DropdownMenuItem onClick={() => unarchive.mutate(ids, { onSuccess: clearSelection })}><RotateCcw className="size-4" />Unarchive</DropdownMenuItem> : <DropdownMenuItem onClick={() => archive.mutate(ids, { onSuccess: clearSelection })}><Archive className="size-4" />Archive</DropdownMenuItem>}
          <DropdownMenuItem onClick={() => read.mutate({ ids, read: true }, { onSuccess: clearSelection })}><Mail className="size-4" />Mark as read</DropdownMenuItem>
          <DropdownMenuItem onClick={() => read.mutate({ ids, read: false }, { onSuccess: clearSelection })}><MailOpen className="size-4" />Mark as unread</DropdownMenuItem>
          <DropdownMenuItem onClick={() => starred.mutate({ ids, starred: true }, { onSuccess: clearSelection })}><Star className="size-4" />Star</DropdownMenuItem>
          <DropdownMenuItem onClick={() => starred.mutate({ ids, starred: false }, { onSuccess: clearSelection })}><StarOff className="size-4" />Remove star</DropdownMenuItem>
          {labelsEnabled ? <LabelMenu threadIds={ids} /> : null}
          <MoveMenu threadIds={ids} />
          {isJunk ? <DropdownMenuItem onClick={() => markNotJunk.mutate(ids, { onSuccess: clearSelection })}><ShieldAlert className="size-4" />Not spam</DropdownMenuItem> : !isTrash ? <>
            <DropdownMenuItem onClick={() => reportJunk.mutate({ ids }, { onSuccess: clearSelection })}><ShieldAlert className="size-4" />Report spam</DropdownMenuItem>
            <DropdownMenuItem onClick={() => reportJunk.mutate({ ids, phishing: true }, { onSuccess: clearSelection })}><ShieldAlert className="size-4" />Report phishing</DropdownMenuItem>
          </> : null}
          <DropdownMenuItem variant="destructive" onClick={() => isTrash ? setPermanentDeleteOpen(true) : trash.mutate(ids, { onSuccess: clearSelection })}><Trash2 className="size-4" />{isTrash ? "Delete permanently" : "Move to trash"}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {mailbox?.role === "inbox" ? <SnoozeDialog threadIds={ids} /> : null}
      <Button variant="ghost" size="icon-sm" onClick={clearSelection} aria-label="Clear selection"><X className="size-4" /></Button>
    </> : <><Button variant="ghost" size="icon-sm" aria-label="Refresh" onClick={() => void queryClient.invalidateQueries({ queryKey: ["acc", "emails"] })}><RefreshCw className="size-4" /></Button>{isTrash && total != null && total > 0 ? <Button variant="ghost" size="sm" disabled={emptyTrash.isPending} onClick={() => setEmptyTrashOpen(true)}>Empty Trash</Button> : null}</>}
    <div className="ms-auto flex shrink-0 items-center gap-0.5">
      <span className="me-1 whitespace-nowrap text-xs text-muted-foreground tabular-nums" aria-live="polite">
        {results.isPending ? "Loading…" : results.isError ? "Couldn't load" : total === 0 ? "0 messages" : `${count ? position + 1 : 0}–${position + count}${total == null ? "" : ` of ${total.toLocaleString()}`}`}
      </span>
      {total != null && total > MAIL_PAGE_SIZE ? <Popover open={jumpOpen} onOpenChange={open => { setJumpOpen(open); if (open) setJumpPage(String(page + 1)) }}><PopoverTrigger render={<Button variant="ghost" size="sm" aria-label="Jump to page" className="hidden sm:inline-flex" />}>Page {page + 1}</PopoverTrigger><PopoverContent align="end" className="w-48"><form className="flex items-center gap-2" onSubmit={event => { event.preventDefault(); const next = Number(jumpPage); if (Number.isInteger(next) && next >= 1 && next <= Math.ceil(total / MAIL_PAGE_SIZE)) { onPageChange(next - 1); setJumpOpen(false) } }}><Input aria-label={`Page number, 1 to ${Math.ceil(total / MAIL_PAGE_SIZE)}`} type="number" min={1} max={Math.ceil(total / MAIL_PAGE_SIZE)} value={jumpPage} onChange={event => setJumpPage(event.target.value)} className="w-20" /><Button size="sm" type="submit">Go</Button></form></PopoverContent></Popover> : null}
      <Button variant="ghost" size="icon-sm" aria-label="Previous page" disabled={page === 0 || results.isPending} onClick={() => onPageChange(page - 1)}><ChevronLeft className="size-4 rtl:rotate-180" /></Button>
      <Button variant="ghost" size="icon-sm" aria-label="Next page" disabled={!hasNext || results.isPending || results.isError} onClick={() => onPageChange(page + 1)}><ChevronRight className="size-4 rtl:rotate-180" /></Button>
    </div>
    {isTrash ? <PermanentDeleteDialog open={permanentDeleteOpen} onOpenChange={setPermanentDeleteOpen} count={ids.length} onConfirm={() => permanentlyDelete.mutate(ids, { onSuccess: clearSelection })} /> : null}
    <AlertDialog open={emptyTrashOpen} onOpenChange={setEmptyTrashOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Empty Trash?</AlertDialogTitle><AlertDialogDescription>All messages in Trash will be permanently deleted. This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => emptyTrash.mutate()}>Empty Trash</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </header><MailListControls sort={sort} onSortChange={onSortChange} quickFilters={quickFilters} onQuickFiltersChange={onQuickFiltersChange} sent={sent} /></div>
}
