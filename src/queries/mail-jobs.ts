import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "@/hooks/use-session"
import {
  getMailJobsCapability,
  getMailJobs,
  queueMailSend,
  queueMailSnooze,
  cancelMailJob,
  retryMailJob,
} from "@/server/mail-jobs.rpc"
import type { SendDraftInput } from "@/services/mail/mail.service"

function useKey() {
  const { data } = useSession()
  return [
    "mail-jobs",
    data?.userId ?? "signed-out",
    data?.accountId ?? "primary",
  ]
}
export function useMailJobsCapability() {
  const key = useKey()
  return useQuery({
    queryKey: [...key, "capability"],
    queryFn: () => getMailJobsCapability(),
    staleTime: 60_000,
  })
}
export function useMailJobs(options?: {
  enabled?: boolean
  refetchInterval?: number | false
}) {
  const key = useKey()
  return useQuery({
    queryKey: key,
    queryFn: () => getMailJobs(),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? false,
  })
}
export function useQueueMailSend() {
  const qc = useQueryClient()
  const key = useKey()
  return useMutation({
    mutationFn: ({
      input,
      scheduledFor,
      requestId,
    }: {
      input: SendDraftInput
      scheduledFor?: string
      requestId: string
    }) => queueMailSend({ data: { input, scheduledFor, requestId } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: key }),
  })
}
export function useQueueMailSnooze() {
  const qc = useQueryClient()
  const key = useKey()
  return useMutation({
    mutationFn: ({
      threadIds,
      wakeAt,
    }: {
      threadIds: string[]
      wakeAt: string
    }) =>
      queueMailSnooze({
        data: { threadIds, wakeAt, requestId: crypto.randomUUID() },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key })
      void qc.invalidateQueries({ queryKey: ["acc", "emails"] })
    },
  })
}
export function useCancelMailJob() {
  const qc = useQueryClient()
  const key = useKey()
  return useMutation({
    mutationFn: (id: string) => cancelMailJob({ data: { id } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: key }),
  })
}
export function useRetryMailJob() {
  const qc = useQueryClient()
  const key = useKey()
  return useMutation({
    mutationFn: (id: string) => retryMailJob({ data: { id } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: key }),
  })
}
