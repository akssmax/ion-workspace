/**
 * Mail React Query hooks. Components use these exclusively; they never call
 * the JMAP client directly.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  EmailProperties,
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
import { getPrimaryAccountId } from "../services/jmap.service"
import { syncEngine } from "../jmap/sync/sync.engine"
import { useSession } from "../hooks/use-session"
import { combineMailFilters, MAIL_QUICK_FILTERS, mailSortComparators, type MailQuickFilter, type MailSort } from "@/lib/mail-list"
import { getJmapClient } from "../services/jmap.service"
import { JMAP_CAPS } from "../jmap/types"

function useMailScopeKey(): string {
  const { data } = useSession()
  return data?.accountId ?? data?.userId ?? "signed-out"
}

function canReadOffline(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return (typeof navigator !== "undefined" && !navigator.onLine) || code === "transport" || code === "106"
}

export function useMailboxes() {
  const accountScope = useMailScopeKey()
  return useQuery({
    queryKey: [...qk.mailboxes(), accountScope],
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
  const accountScope = useMailScopeKey()
  return useQuery({
    queryKey: [...qk.identities(), accountScope],
    queryFn: () => mailService.getIdentities(),
  })
}

export function useUpdateIdentity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const client = await (await import("../services/jmap.service")).getJmapClient()
      await client.mail.updateIdentity(id, { name })
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.identities() }),
  })
}

export interface EmailListScope {
  mailboxId?: string
  query?: string
  limit?: number
  sort?: MailSort
  sent?: boolean
  quickFilters?: MailQuickFilter[]
}

/**
 * Emails in a mailbox (or globally when `mailboxId` is omitted), with a
 * parsed search filter applied on top.
 */
export const MAIL_PAGE_SIZE = 25

export function useMailSortCapabilities() {
  const accountScope = useMailScopeKey()
  return useQuery({
    queryKey: [ACCOUNT_KEY, "mail-sort-capabilities", accountScope],
    queryFn: async (): Promise<string[]> => {
      const client = await getJmapClient()
      const session = await client.session()
      const accountId = session.primaryAccounts[JMAP_CAPS.MAIL]
      const accountCaps = session.accounts[accountId]?.accountCapabilities[JMAP_CAPS.MAIL] as { emailQuerySortOptions?: string[] } | undefined
      const sessionCaps = session.capabilities[JMAP_CAPS.MAIL] as { emailQuerySortOptions?: string[] } | undefined
      return accountCaps?.emailQuerySortOptions ?? sessionCaps?.emailQuerySortOptions ?? ["receivedAt"]
    },
    staleTime: 60_000,
  })
}

export function useEmails(scope: EmailListScope, page = 0) {
  const accountScope = useMailScopeKey()
  const { data: session } = useSession()
  const mailboxId = scope.mailboxId ?? "all"
  const query = scope.query ?? ""
  const pageSize = scope.limit ?? MAIL_PAGE_SIZE
  return useQuery({
    queryKey: [...qk.emails(mailboxId, query), accountScope, pageSize, page, scope.sort ?? "newest", !!scope.sent, [...(scope.quickFilters ?? [])].sort().join(",")],
    queryFn: () => fetchEmailsForScope({ ...scope, limit: pageSize }, mailboxId, page * pageSize, session?.accountId),
    enabled: scope.mailboxId !== undefined || scope.query !== undefined,
    staleTime: 30_000,
    gcTime: 60_000,
  })
}

async function fetchEmailsForScope(scope: EmailListScope, mailboxId: string, position: number, cachedAccountId?: string) {
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
          : { operator: "OR", conditions: ids.map((id) => ({ inMailbox: id })) }
      filter = combineMailFilters(clause, filter)
    }
  } else if (mailboxId !== "all") {
    // Keep the mailbox context when searching inside a folder.
    filter = combineMailFilters({ inMailbox: mailboxId }, filter)
  }

  filter = combineMailFilters(filter, ...MAIL_QUICK_FILTERS.filter(({ value }) => scope.quickFilters?.includes(value)).map(({ clause }) => clause))

  let accountId = cachedAccountId
  try {
    accountId ??= (await getPrimaryAccountId()) ?? undefined
    const client = await getJmapClient()
    const jmapSession = await client.session()
    const sortOptions = (accountId ? jmapSession.accounts[accountId]?.accountCapabilities[JMAP_CAPS.MAIL] as { emailQuerySortOptions?: string[] } | undefined : undefined)?.emailQuerySortOptions
      ?? (jmapSession.capabilities[JMAP_CAPS.MAIL] as { emailQuerySortOptions?: string[] } | undefined)?.emailQuerySortOptions
      ?? ["receivedAt"]
    const result = await mailService.getEmails(mailboxId, {
      filter,
      sort: mailSortComparators(scope.sort ?? "newest", scope.sent, sortOptions),
      limit: scope.limit ?? 60,
      position,
      calculateTotal: true,
    })
    if (accountId) void syncEngine.storeMailPage(accountId, result.emails).catch(() => {})
    return result
  } catch (error) {
    if (!accountId || scope.query || scope.sort && scope.sort !== "newest" || scope.quickFilters?.length || !canReadOffline(error)) {
      if (canReadOffline(error) && (scope.sort && scope.sort !== "newest" || scope.quickFilters?.length)) throw new Error("Reconnect to sort or filter messages; cached mail is shown newest first.")
      throw error
    }
    return syncEngine.offlineMailPage(accountId, mailboxId, position, scope.limit ?? 60)
  }
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
  const accountScope = useMailScopeKey()
  const { data: session } = useSession()
  return useQuery({
    queryKey: [...qk.thread(threadId ?? "none"), accountScope],
    queryFn: async () => {
      let accountId = session?.accountId
      try {
        accountId ??= (await getPrimaryAccountId()) ?? undefined
        const data = await mailService.getThread(threadId as JmapId)
        if (accountId) void syncEngine.storeThread(accountId, data.thread, data.emails).catch(() => {})
        return data
      } catch (error) {
        if (!accountId || !canReadOffline(error)) throw error
        const cached = await syncEngine.offlineThread(accountId, threadId as JmapId)
        if (!cached) throw error
        return cached
      }
    },
    enabled: !!threadId && enabled,
    select: (data): ThreadView => {
      const last: EmailProperties | undefined = data.emails.at(-1)
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
  const accountScope = useMailScopeKey()
  return useQuery({
    queryKey: [ACCOUNT_KEY, "email", id, accountScope],
    queryFn: () => mailService.getEmailById(id!),
    enabled: !!id,
  })
}

/**
 * All emails belonging to the given threads (resolved via Thread/get).
 * Used by label/move menus to compute per-label state across a selection.
 */
export function useThreadEmails(threadIds: JmapId[], enabled = true) {
  const accountScope = useMailScopeKey()
  return useQuery({
    queryKey: [ACCOUNT_KEY, "thread-emails", accountScope, ...[...threadIds].sort()],
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

export function useUnarchiveEmails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: JmapId[]) => mailService.unarchiveEmails(ids),
    onSuccess: () => invalidateMailViews(qc),
  })
}

/** Move threads/emails without dropping unrelated labels. */
export function useMoveEmails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      ids,
      toMailboxId,
      fromMailboxId,
    }: {
      ids: JmapId[]
      toMailboxId: JmapId
      fromMailboxId?: JmapId
    }) => mailService.moveEmails(ids, toMailboxId, fromMailboxId),
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

export function useReportJunk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, phishing }: { ids: JmapId[]; phishing?: boolean }) =>
      mailService.reportJunk(ids, phishing),
    onSuccess: () => invalidateMailViews(qc),
  })
}

export function useMarkNotJunk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: JmapId[]) => mailService.markNotJunk(ids),
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

export function usePermanentlyDeleteEmails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: JmapId[]) => mailService.permanentlyDeleteEmails(ids),
    onSuccess: () => invalidateMailViews(qc),
  })
}

export function useEmptyTrash() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => mailService.emptyTrash(),
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
      // The sent reply lands in the same thread; refresh any open thread view.
      void qc.invalidateQueries({ queryKey: [ACCOUNT_KEY, "thread"] })
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
