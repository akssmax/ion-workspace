import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "@/hooks/use-session"
import { getJmapClient } from "@/services/jmap.service"

const CAPABILITY = "urn:ietf:params:jmap:sieve"
const SCRIPT_NAME = "ion-managed-filters"
export interface MailFilterRule { id: string; from: string; mailbox: string }
interface SieveScript { id: string; name: string; blobId: string; isActive: boolean }

async function context() {
  const client = await getJmapClient()
  const session = await client.session()
  const accountId = session.primaryAccounts?.[CAPABILITY] ?? client.mail.accountId
  return { client, accountId, available: !!session.capabilities?.[CAPABILITY] && !!accountId && !!session.accounts?.[accountId]?.accountCapabilities?.[CAPABILITY] }
}

async function scripts(client: Awaited<ReturnType<typeof getJmapClient>>, accountId: string) {
  const response = await client.call<{ list: SieveScript[] }>("SieveScript/get", { accountId, ids: null })
  return response.list
}

function readRules(text: string): MailFilterRule[] {
  return text.split("\n").flatMap(line => {
    if (!line.startsWith("# ion-filter:")) return []
    try { const rule = JSON.parse(decodeURIComponent(line.slice(13))) as MailFilterRule; return rule.id && rule.from && rule.mailbox ? [rule] : [] } catch { return [] }
  })
}

function quote(value: string): string { return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replace(/[\r\n]/g, "") }

function buildScript(rules: MailFilterRule[]): string {
  return ["require [\"fileinto\"];", "# Managed by Ion mail settings. Edit filters in the app.", ...rules.flatMap(rule => [
    `# ion-filter:${encodeURIComponent(JSON.stringify(rule))}`,
    `if address :is \"from\" \"${quote(rule.from)}\" { fileinto \"${quote(rule.mailbox)}\"; stop; }`,
  ])].join("\n") + "\n"
}

export function useMailFilters() {
  const { data: session } = useSession()
  return useQuery({ queryKey: ["mail-filters", session?.accountId ?? session?.userId], queryFn: async () => {
    const { client, accountId, available } = await context()
    if (!available || !accountId) return { available: false, blocked: false, rules: [] as MailFilterRule[] }
    const list = await scripts(client, accountId)
    const managed = list.find(item => item.name === SCRIPT_NAME)
    const blocked = list.some(item => item.isActive && item.name !== SCRIPT_NAME)
    const content = managed ? await client.download(accountId, managed.blobId).then(blob => blob.text()) : ""
    return { available: true, blocked, rules: readRules(content) }
  }, retry: false })
}

export function useSaveMailFilters() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (rules: MailFilterRule[]) => {
    const { client, accountId, available } = await context()
    if (!available || !accountId) throw new Error("Sieve filters are unavailable on this account.")
    const list = await scripts(client, accountId)
    if (list.some(item => item.isActive && item.name !== SCRIPT_NAME)) throw new Error("Another Sieve script is active. Manage it in Stalwart before enabling app filters.")
    const managed = list.find(item => item.name === SCRIPT_NAME)
    const encoded = new TextEncoder().encode(buildScript(rules))
    const upload = await client.upload(accountId, encoded.buffer as ArrayBuffer, { contentType: "application/sieve", filename: `${SCRIPT_NAME}.sieve` })
    const validation = await client.call<{ error?: { description?: string } | null }>("SieveScript/validate", { accountId, blobId: upload.blobId })
    if (validation.error) throw new Error(validation.error.description ?? "The filter script is invalid.")
    const args = managed
      ? { accountId, update: { [managed.id]: { blobId: upload.blobId } }, onSuccessActivateScript: managed.id }
      : { accountId, create: { managed: { name: SCRIPT_NAME, blobId: upload.blobId } }, onSuccessActivateScript: "#managed" }
    const result = await client.call<{ notCreated?: Record<string, { description?: string }>; notUpdated?: Record<string, { description?: string }> }>("SieveScript/set", args)
    const failure = result.notCreated?.managed ?? (managed ? result.notUpdated?.[managed.id] : undefined)
    if (failure) throw new Error(failure.description ?? "The filter script was rejected.")
  }, onSuccess: () => void qc.invalidateQueries({ queryKey: ["mail-filters"] }) })
}
