import { createHash } from "node:crypto"
import { pilotRequestSchema  } from "../lib/pilot-request"
import type {PilotResult} from "../lib/pilot-request";

type Options = {
  endpoint?: string
  token?: string
  fetcher?: typeof fetch
  now?: () => number
}
/** Bounded, process-local protection. Use ingress rate limiting across replicas. */
export function createPilotHandler({
  endpoint,
  token,
  fetcher = fetch,
  now = Date.now,
}: Options) {
  let available = false
  try {
    const url = new URL(endpoint ?? "")
    available = url.protocol === "https:" && !url.username && !url.password
  } catch {
    /* Unconfigured */
  }
  const buckets = new Map<string, { count: number; expires: number }>()
  const delivered = new Map<string, number>()
  const pending = new Set<string>()
  const windowMs = 15 * 60_000
  function allow(key: string, max: number, time: number) {
    const entry = buckets.get(key)
    if (!entry || entry.expires <= time) {
      buckets.set(key, { count: 1, expires: time + windowMs })
      return true
    }
    entry.count++
    return entry.count <= max
  }
  return {
    available,
    async submit(input: unknown): Promise<PilotResult> {
      if (!available) return { ok: false, reason: "unavailable" }
      const parsed = pilotRequestSchema.safeParse(input)
      if (!parsed.success || parsed.data.website)
        return { ok: false, reason: "invalid" }
      const { website: _trap, ...data } = parsed.data
      const time = now()
      for (const [key, entry] of buckets)
        if (entry.expires <= time) buckets.delete(key)
      for (const [key, expires] of delivered)
        if (expires <= time) delivered.delete(key)
      const fingerprint = createHash("sha256")
        .update(JSON.stringify(data))
        .digest("hex")
      if (delivered.has(fingerprint))
        return { ok: true, requestId: data.requestId }
      if (pending.has(fingerprint)) return { ok: false, reason: "limited" }
      const emailKey = createHash("sha256")
        .update(data.email.toLowerCase())
        .digest("hex")
      if (!allow("global", 100, time) || !allow(emailKey, 3, time))
        return { ok: false, reason: "limited" }
      pending.add(fingerprint)
      try {
        const response = await fetcher(endpoint!, {
          method: "POST",
          redirect: "error",
          signal: AbortSignal.timeout(10_000),
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": data.requestId,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            ...data,
            submittedAt: new Date(time).toISOString(),
            sourcePage:
              data.source === "enterprise" ? "/enterprise" : "/request-access",
          }),
        })
        if (!response.ok) return { ok: false, reason: "delivery" }
        delivered.set(fingerprint, time + windowMs)
        return { ok: true, requestId: data.requestId }
      } catch {
        return { ok: false, reason: "delivery" }
      } finally {
        pending.delete(fingerprint)
      }
    },
  }
}
const handler = createPilotHandler({
  endpoint: process.env.PILOT_FORM_ENDPOINT,
  token: process.env.PILOT_FORM_TOKEN,
})
export const pilotAvailable = () => handler.available
export const submitPilotRequest = (input: unknown) => handler.submit(input)
