import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createCalendarFeed,
  deleteCalendarFeed,
  getCalendarFeeds,
  refreshCalendarFeed,
} from "@/server/calendar-feeds.rpc"
import { useSession } from "@/hooks/use-session"
import { isDemoRuntime } from "@/lib/demo/runtime"
const key = ["calendar", "feeds"]
export function useCalendarFeeds() {
  const session = useSession().data
  return useQuery({
    queryKey: [...key, session?.userId],
    queryFn: () => getCalendarFeeds(),
    enabled: !!session && !isDemoRuntime,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}
export function useCreateCalendarFeed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; url: string; color?: string }) =>
      createCalendarFeed({ data }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: key }),
  })
}
export function useDeleteCalendarFeed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCalendarFeed({ data: id }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: key }),
  })
}
export function useRefreshCalendarFeed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => refreshCalendarFeed({ data: id }),
    onSettled: () => void qc.invalidateQueries({ queryKey: key }),
  })
}
