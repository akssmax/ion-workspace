import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getJmapClient } from "@/services/jmap.service"
import { useSession } from "@/hooks/use-session"

const CAPABILITY = "urn:ietf:params:jmap:vacationresponse"
export interface VacationResponse { id: "singleton"; isEnabled: boolean; fromDate: string | null; toDate: string | null; subject: string | null; textBody: string | null }

async function account() {
  const client = await getJmapClient()
  const session = await client.session()
  const accountId = session.primaryAccounts?.[CAPABILITY] ?? client.mail.accountId
  const supported = !!session.capabilities?.[CAPABILITY] && !!accountId && !!session.accounts?.[accountId]?.accountCapabilities?.[CAPABILITY]
  return { client, accountId, supported }
}

export function useVacationResponse() {
  const { data: session } = useSession()
  return useQuery({ queryKey: ["vacation", session?.accountId ?? session?.userId], queryFn: async () => {
    const { client, accountId, supported } = await account()
    if (!supported || !accountId) return { available: false, response: null as VacationResponse | null }
    const result = await client.call<{ list: VacationResponse[] }>("VacationResponse/get", { accountId, ids: ["singleton"] })
    return { available: true, response: result.list[0] ?? null }
  }, retry: false })
}

export function useSaveVacationResponse() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (patch: Omit<VacationResponse, "id">) => {
    const { client, accountId, supported } = await account()
    if (!supported || !accountId) throw new Error("Vacation response is unavailable on this account.")
    const result = await client.call<{ notUpdated?: Record<string, { description?: string }> }>("VacationResponse/set", { accountId, update: { singleton: patch } })
    if (result.notUpdated?.singleton) throw new Error(result.notUpdated.singleton.description ?? "The server rejected the vacation response.")
  }, onSuccess: () => void qc.invalidateQueries({ queryKey: ["vacation"] }) })
}
