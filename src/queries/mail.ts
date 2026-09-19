/**
 * Mail React Query hooks. Components use these exclusively; they never call
 * the JMAP client directly.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  EmailFilterOperator,
  JmapId,
  Mailbox,
  Thread,
} from "../jmap/types/mail"
import * as mailService from "../services/mail/mail.service"
import { parseSearch } from "../lib/search"
import { formatRelative } from "../lib/dates"
import { qk } from "./keys"
import { ACCOUNT_KEY } from "./client"

export function useMailboxes() {
  return useQuery({
    queryKey: qk.mailboxes(),
    queryFn: () => mailService.getMailboxes(),
    select: sortMailboxes,
    staleTime: 60_000,
  })
}

/** Create a custom mailbox (folder or label container). */
export function useCreateMailbox() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) =>
      mailService.setMailboxes({ create: { new: { name } } }),
    onSuccess: (res) => {
      const err = res.notCreated?.new
      if (err) throw new Error(err.description ?? "Couldn't create folder.")
      void qc.invalidateQueries({ queryKey: qk.mailboxes() })
    },
  })
}

/** Rename a mailbox. */
export function useRenameMailbox() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: JmapId; name: string }) =>
      mailService.setMailboxes({ update: { [id]: { name } } }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: qk.mailboxes() }),
  })
}

/** Delete a custom mailbox (role mailboxes are rejected server-side). */
export function useDeleteMailbox() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: JmapId) =>
      mailService.setMailboxes({ destroy: [id] }),
    onSuccess: (res) => {
      const err = res.notDestroyed?.[Object.keys(res.notDestroyed ?? {})[0]]
      if (err) throw new Error(err.description ?? "Couldn't delete folder.")
      void qc.invalidateQueries({ queryKey: qk.mailboxes() })
      void qc.invalidateQueries({ queryKey: ["acc", "emails"] })
    },
  })
}

export function useIdentities() {
  return useQuery({
    queryKey: qk.identities(),
    queryFn: () => mailService.getIdentities(),
  })
}

export interface EmailListScope {
  mailboxId?: string
  query?: string
  limit?: number
}

/**
 * Emails in a mailbox (or globally when `mailboxId` is omitted), with a
 * parsed search filter applied on top.
 */
export function useEmails(scope: EmailListScope) {
  const mailboxId = scope.mailboxId ?? "all"
  const query = scope.query ?? ""
  return useQuery({
    queryKey: qk.emails(mailboxId, query),
    queryFn: () => fetchEmailsForScope(scope, mailboxId),
    enabled: scope.mailboxId !== undefined || scope.query !== undefined,
  })
}

async function fetchEmailsForScope(scope: EmailListScope, mailboxId: string) {
  const parsed = scope.query ? parseSearch(scope.query) : null
  let filter: EmailFilterOperator | undefined = parsed?.filter ?? undefined

  // Resolve `in:<name>` / `label:<name>` tokens to mailbox ids (matching by
  // role or display name, case-insensitive).
  if (parsed?.mailboxNames.length) {
    const mailboxes = await mailService.getMailboxes()
    const ids = parsed.mailboxNames
      .map((name) => resolveMailboxId(mailboxes, name))
      .filter((id): id is string => !!id)
    if (ids.length) {
      const clause: EmailFilterOperator =
        ids.length === 1
          ? { inMailbox: ids[0] }
          : { anyOf: ids.map((id) => ({ inMailbox: id })) }
      filter = filter ? { allOf: [clause, filter] } : clause
    }
  } else if (mailboxId !== "all") {
    // Keep the mailbox context when searching inside a folder.
    filter = filter
      ? { allOf: [{ inMailbox: mailboxId }, filter] }
      : { inMailbox: mailboxId }
  }

  return mailService.getEmails(mailboxId, { filter, limit: scope.limit ?? 60 })
}

/** Match a search token to a mailbox by role ("inbox") or name ("Receipts"). */
function resolveMailboxId(
  mailboxes: Mailbox[],
  name: string
): string | undefined {
  const needle = name.toLowerCase()
  const byRole = mailboxes.find((m) => m.role?.toLowerCase() === needle)
  if (byRole) return byRole.id
  return mailboxes.find((m) => m.name.toLowerCase() === needle)?.id
}

export interface ThreadView {
  thread: Thread
  emails: Awaited<ReturnType<typeof mailService.getThread>>["emails"]
  latestSubject: string
  participants: string
  snippet: string
  lastReceivedAt: string
}

export function useThread(threadId: string | null, enabled = true) {
  return useQuery({
    queryKey: qk.thread(threadId ?? "none"),
    queryFn: () => mailService.getThread(threadId as JmapId),
    enabled: !!threadId && enabled,
    select: (data): ThreadView => {
      const last = data.emails[data.emails.length - 1]
      const parsedSnippet = () => {
        if (data.thread.snippet) return data.thread.snippet
        if (last?.preview) return last.preview
        return ""
      }
      return {
        thread: data.thread,
        emails: data.emails,
        latestSubject: data.thread.subject ?? last?.subject ?? "(no subject)",
        participants: [
          ...new Set(
            data.emails.flatMap((e) => e.from?.map((f) => f.email) ?? [])
          ),
        ]
          .filter(Boolean)
          .join(", "),
        snippet: parsedSnippet(),
        lastReceivedAt: last?.receivedAt
          ? formatRelative(last.receivedAt)
          : "—",
      }
    },
  })
}

// --- Mutations -----------------------------------------------------------

function invalidateMailViews(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["acc", "emails"] })
  void queryClient.invalidateQueries({ queryKey: qk.mailboxes() })
}

/** A single email with body values (draft reopen, previews). */
export function useEmail(id: JmapId | null) {
  return useQuery({
    queryKey: [ACCOUNT_KEY, "email", id],
    queryFn: () => mailService.getEmailById(id!),
    enabled: !!id,
  })
}

/**
 * All emails belonging to the given threads (resolved via Thread/get).
 * Used by label/move menus to compute per-label state across a selection.
 */
export function useThreadEmails(threadIds: JmapId[], enabled = true) {
  return useQuery({
    queryKey: [ACCOUNT_KEY, "thread-emails", ...[...threadIds].sort()],
    queryFn: async () => {
      const threads = await mailService.getThreads(threadIds)
      const ids = [...new Set(threads.flatMap((t) => t.emailIds))]
      if (!ids.length) return []
      return mailService.getEmailsByIds(ids, ["threadId", "mailboxIds"])
    },
    enabled: enabled && threadIds.length > 0,
  })
}

/** Apply or remove a label on threads/emails (multi-mailbox membership). */
export function useApplyLabel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      ids,
      labelId,
      applied,
    }: {
      ids: JmapId[]
      labelId: JmapId
      applied: boolean
    }) => mailService.applyLabel(ids, labelId, applied),
    onSuccess: () => invalidateMailViews(qc),
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, read }: { ids: JmapId[]; read: boolean }) =>
      mailService.markRead(ids, read),
    onSuccess: () => invalidateMailViews(qc),
  })
}

export function useMarkStarred() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, starred }: { ids: JmapId[]; starred: boolean }) =>
      mailService.markStarred(ids, starred),
    onSuccess: () => invalidateMailViews(qc),
  })
}

export function useArchiveEmails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: JmapId[]) => mailService.archiveEmails(ids),
    onSuccess: () => invalidateMailViews(qc),
  })
}

/** Move threads/emails to another mailbox (replaces membership). */
export function useMoveEmails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      ids,
      toMailboxId,
    }: {
      ids: JmapId[]
      toMailboxId: JmapId
    }) => mailService.moveEmails(ids, toMailboxId),
    onSuccess: () => invalidateMailViews(qc),
  })
}

export function useTrashEmails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: JmapId[]) => mailService.trashEmails(ids),
    onSuccess: () => invalidateMailViews(qc),
  })
}

export function useRestoreEmails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: JmapId[]) => mailService.restoreEmails(ids),
    onSuccess: () => invalidateMailViews(qc),
  })
}

export function useSendEmail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: mailService.SendDraftInput) =>
      mailService.sendDraft(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["acc", "emails"] })
      void qc.invalidateQueries({ queryKey: qk.mailboxes() })
    },
  })
}

export function useSaveDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Parameters<typeof mailService.saveDraft>[0]) =>
      mailService.saveDraft(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["acc", "emails"] }),
  })
}

export function useUploadAttachment() {
  return useMutation({
    mutationFn: (file: File) => mailService.uploadAttachment(file),
  })
}

export function useDownloadAttachment() {
  return useMutation({
    mutationFn: (blobId: JmapId) => mailService.downloadAttachment(blobId),
  })
}

const ROLE_ORDER: Record<string, number> = {
  inbox: 0,
  starred: 1,
  important: 2,
  sent: 3,
  drafts: 4,
  archive: 5,
  junk: 6,
  trash: 7,
}

export function sortMailboxes(mailboxes: Mailbox[]): Mailbox[] {
  return [...mailboxes].sort((a, b) => {
    const ra = a.role ? (ROLE_ORDER[a.role] ?? 10) : 10
    const rb = b.role ? (ROLE_ORDER[b.role] ?? 10) : 10
    if (ra !== rb) return ra - rb
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  })
}
