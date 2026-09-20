/** Durable mail scheduling. Payloads and refresh credentials are encrypted at rest. */
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto"
import { JmapClient } from "@/jmap/client/JmapClient"
import type { Transport } from "@/jmap/client/transport"
import { JMAP_CAPS, type JmapSession } from "@/jmap/types"
import type { SendDraftInput } from "@/services/mail/mail.service"
import { toJmapRequest } from "@/jmap/provider/ServerProxyTransport"
import { mailMetadataPool } from "./mail-metadata.server"
import { WORKSPACE_CONFIG } from "./config.server"
import type { SessionData } from "./session.server"

type Credentials = { accessToken: string; refreshToken: string; expiresAt: number }
export type MailJobKind = "send" | "snooze"
export type MailJobStatus = "queued" | "processing" | "sent" | "completed" | "failed" | "needs_review" | "cancelled"
export type MailJobSummary = { id: string; kind: MailJobKind; status: MailJobStatus; runAt: string; createdAt: string; error: string | null; attempts: number; subject: string }
type JobRow = { id: string; user_id: string; account_id: string; kind: MailJobKind; status: MailJobStatus; run_at: Date; created_at: Date; payload_ciphertext: string; credential_ciphertext: string; error: string | null; attempts: number }
type JobPayload = { input: SendDraftInput } | { ids: string[] }
const scope = (session: SessionData) => [session.userId, session.accountId ?? "primary"]

function key(): Buffer {
  const secret = process.env.MAIL_JOB_ENCRYPTION_KEY
  if (!secret || secret.length < 32) throw new Error("MAIL_JOB_ENCRYPTION_KEY must contain at least 32 characters.")
  return createHash("sha256").update(secret).digest()
}
function seal(value: unknown): string {
  const nonce = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), nonce)
  return Buffer.concat([nonce, cipher.update(JSON.stringify(value)), cipher.final(), cipher.getAuthTag()]).toString("base64")
}
function unseal<T>(value: string): T {
  const bytes = Buffer.from(value, "base64")
  const decipher = createDecipheriv("aes-256-gcm", key(), bytes.subarray(0, 12))
  decipher.setAuthTag(bytes.subarray(-16))
  return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(12, -16)), decipher.final()]).toString()) as T
}
function database() {
  const db = mailMetadataPool()
  if (!db) throw new Error("DATABASE_URL is required for scheduled mail.")
  return db
}
export async function mailJobsAvailable(session: SessionData): Promise<boolean> {
  if (session.mode !== "real" || !session.accountId || !session.refreshToken || !session.accessToken || !process.env.MAIL_JOB_ENCRYPTION_KEY) return false
  const db = mailMetadataPool()
  if (!db) return false
  try {
    key()
    const result = await db.query<{ ready: boolean }>("SELECT to_regclass('public.mail_jobs') IS NOT NULL AND to_regclass('public.mail_job_credentials') IS NOT NULL AS ready")
    return !!result.rows[0]?.ready
  } catch { return false }
}

export async function queueJob(session: SessionData, kind: MailJobKind, payload: JobPayload, runAt: Date, requestId: string): Promise<{ id: string; runAt: string }> {
  if (!(await mailJobsAvailable(session))) throw new Error("Scheduled mail requires a real account, database, refresh token, and MAIL_JOB_ENCRYPTION_KEY.")
  const accessToken = session.accessToken!
  const refreshToken = session.refreshToken!
  if (runAt.getTime() < Date.now() + 1000 || runAt.getTime() > Date.now() + 366 * 86400_000) throw new Error("Choose a future time within one year.")
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) throw new Error("Invalid request ID.")
  if (JSON.stringify(payload).length > 2_000_000) throw new Error("Scheduled message is too large.")
  const id = randomUUID()
  const db = database()
  const credentials: Credentials = { accessToken, refreshToken, expiresAt: session.accessTokenExpiresAt ?? 0 }
  await db.query(
    `INSERT INTO mail_job_credentials (user_id, account_id, credential_ciphertext, expires_at)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id, account_id) DO UPDATE SET credential_ciphertext=EXCLUDED.credential_ciphertext, expires_at=EXCLUDED.expires_at
     WHERE mail_job_credentials.expires_at <= EXCLUDED.expires_at`, [...scope(session), seal(credentials), credentials.expiresAt]
  )
  const result = await db.query<{ id: string; run_at: Date }>(
    `INSERT INTO mail_jobs (id,user_id,account_id,request_id,kind,run_at,payload_ciphertext,credential_ciphertext)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (user_id,account_id,request_id) DO UPDATE SET request_id=EXCLUDED.request_id
     RETURNING id,run_at`,
    [id, ...scope(session), requestId, kind, runAt, seal(payload), seal(credentials)]
  )
  return { id: result.rows[0].id, runAt: result.rows[0].run_at.toISOString() }
}

export async function listJobs(session: SessionData): Promise<MailJobSummary[]> {
  if (!(await mailJobsAvailable(session))) return []
  const result = await database().query<JobRow>("SELECT * FROM mail_jobs WHERE user_id=$1 AND account_id=$2 AND created_at > now() - interval '90 days' ORDER BY created_at DESC LIMIT 100", scope(session))
  return result.rows.map(row => ({
    id: row.id, kind: row.kind, status: row.status, runAt: row.run_at.toISOString(), createdAt: row.created_at.toISOString(), error: row.error, attempts: row.attempts,
    subject: row.kind === "send" ? unseal<{ input: SendDraftInput }>(row.payload_ciphertext).input.subject || "(no subject)" : "Snoozed conversation",
  }))
}
export async function cancelJob(session: SessionData, id: string) {
  const result = await database().query("UPDATE mail_jobs SET status='cancelled', updated_at=now() WHERE id=$1 AND user_id=$2 AND account_id=$3 AND status='queued' RETURNING id", [id, ...scope(session)])
  if (!result.rowCount) throw new Error("This job can no longer be cancelled.")
}
export async function retryJob(session: SessionData, id: string) {
  const result = await database().query("UPDATE mail_jobs SET status='queued', run_at=now() + interval '5 seconds', error=NULL, updated_at=now() WHERE id=$1 AND user_id=$2 AND account_id=$3 AND status='failed' RETURNING id", [id, ...scope(session)])
  if (!result.rowCount) throw new Error("Only failed jobs can be retried. Check Sent before retrying an uncertain submission.")
}

async function refresh(credentials: Credentials): Promise<Credentials> {
  if (credentials.expiresAt > Date.now()) return credentials
  const response = await fetch(WORKSPACE_CONFIG.oauthTokenPath, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: credentials.refreshToken, client_id: WORKSPACE_CONFIG.oauthClientId }), signal: AbortSignal.timeout(15_000) })
  if (!response.ok) throw new Error("Mail authorization expired; sign in and reschedule.")
  const token = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number }
  if (!token.access_token) throw new Error("Mail authorization expired; sign in and reschedule.")
  return { accessToken: token.access_token, refreshToken: token.refresh_token ?? credentials.refreshToken, expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000 }
}

/** Share rotated refresh tokens with the active session under the same lock as the worker. */
export async function currentQueuedCredentials(session: SessionData): Promise<Credentials | null> {
  if (!session.accountId || !process.env.MAIL_JOB_ENCRYPTION_KEY) return null
  const db = mailMetadataPool()
  if (!db) return null
  const connection = await db.connect()
  try {
    await connection.query("BEGIN")
    const result = await connection.query<{ credential_ciphertext: string }>(
      "SELECT credential_ciphertext FROM mail_job_credentials WHERE user_id=$1 AND account_id=$2 FOR UPDATE", scope(session)
    )
    if (!result.rows[0]) {
      await connection.query("COMMIT")
      return null
    }
    const saved = unseal<Credentials>(result.rows[0].credential_ciphertext)
    const current = await refresh(saved)
    if (current !== saved) await connection.query(
      "UPDATE mail_job_credentials SET credential_ciphertext=$3, expires_at=$4 WHERE user_id=$1 AND account_id=$2",
      [...scope(session), seal(current), current.expiresAt]
    )
    await connection.query("COMMIT")
    return current
  } catch (error) {
    await connection.query("ROLLBACK")
    throw error
  } finally { connection.release() }
}
export async function workerClient(credentials: Credentials): Promise<{ client: JmapClient; accountId: string; credentials: Credentials }> {
  const current = await refresh(credentials)
  const headers = { Authorization: `Bearer ${current.accessToken}` }
  const sessionResponse = await fetch(`${WORKSPACE_CONFIG.stalwartOrigin}/.well-known/jmap`, { headers, signal: AbortSignal.timeout(15_000) })
  if (!sessionResponse.ok) throw new Error("Could not access the mail account for this job.")
  const session = await sessionResponse.json() as JmapSession
  const target = new URL(session.apiUrl)
  if (target.origin !== new URL(WORKSPACE_CONFIG.stalwartOrigin).origin || !target.pathname.startsWith("/jmap")) throw new Error("Invalid mail server endpoint.")
  const accountId = session.primaryAccounts[JMAP_CAPS.MAIL]
  if (!accountId || !session.capabilities[JMAP_CAPS.SUBMISSION]) throw new Error("Mail submission is unavailable for this account.")
  const transport: Transport = {
    kind: "real",
    async post(payload) {
      if (payload.some(inv => Array.isArray(inv) && inv[0] === "Core/session")) return [["Core/session", session, "c0"]]
      const response = await fetch(target, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(toJmapRequest(payload, session)), signal: AbortSignal.timeout(30_000) })
      if (!response.ok) throw new Error(`Mail server rejected the job (${response.status}).`)
      return ((await response.json()) as { methodResponses: unknown[] }).methodResponses
    },
    async upload() { throw new Error("Worker uploads are unavailable.") },
    async download() { throw new Error("Worker downloads are unavailable.") },
  }
  const client = new JmapClient(transport, { retries: 0 })
  client.mail.bindAccount(accountId)
  return { client, accountId, credentials: current }
}

/** Invoke each minute from a trusted scheduler; no user session is needed. */
export async function processDueMailJobs(limit = 20): Promise<number> {
  const db = database()
  // A send interrupted after reaching Stalwart is uncertain: never auto-replay it.
  await db.query("UPDATE mail_jobs SET status='needs_review', error='Submission outcome is uncertain. Check Sent before retrying.', updated_at=now() WHERE status='processing' AND kind='send' AND updated_at < now() - interval '5 minutes'")
  await db.query("UPDATE mail_jobs SET status='queued', updated_at=now() WHERE status='processing' AND kind='snooze' AND updated_at < now() - interval '5 minutes'")
  const rows = await db.query<JobRow>(
    `UPDATE mail_jobs SET status='processing', attempts=attempts+1, updated_at=now()
     WHERE id IN (SELECT id FROM mail_jobs WHERE status='queued' AND run_at <= now() ORDER BY run_at FOR UPDATE SKIP LOCKED LIMIT $1)
     RETURNING *`, [Math.min(100, Math.max(1, limit))]
  )
  for (const row of rows.rows) {
    let submissionAttempted = false
    try {
      // Lock account credentials while refreshing so concurrent workers cannot
      // rotate the same refresh token independently.
      const connection = await db.connect()
      let worker: Awaited<ReturnType<typeof workerClient>>
      try {
        await connection.query("BEGIN")
        const latest = await connection.query<{ credential_ciphertext: string }>("SELECT credential_ciphertext FROM mail_job_credentials WHERE user_id=$1 AND account_id=$2 FOR UPDATE", [row.user_id, row.account_id])
        worker = await workerClient(unseal<Credentials>(latest.rows[0]?.credential_ciphertext ?? row.credential_ciphertext))
        await connection.query("UPDATE mail_job_credentials SET credential_ciphertext=$3, expires_at=$4 WHERE user_id=$1 AND account_id=$2", [row.user_id, row.account_id, seal(worker.credentials), worker.credentials.expiresAt])
        await connection.query("COMMIT")
      } catch (error) {
        await connection.query("ROLLBACK")
        throw error
      } finally { connection.release() }
      const { client, accountId } = worker
      if (accountId !== row.account_id) throw new Error("The mail account changed. Sign in and reschedule.")
      if (row.kind === "send") {
        const { input } = unseal<{ input: SendDraftInput }>(row.payload_ciphertext)
        const identities = await client.mail.getIdentities(accountId)
        if (!identities.some(identity => identity.id === input.identityId && identity.email.toLowerCase() === input.from[0]?.email.toLowerCase())) throw new Error("The sending identity is no longer available.")
        submissionAttempted = true
        await client.mail.sendEmail(input, accountId)
        if (input.draftId) await client.mail.destroyEmails([input.draftId], accountId).catch(() => {})
      } else {
        const { ids } = unseal<{ ids: string[] }>(row.payload_ciphertext)
        const trash = await client.mail.findRoleMailbox("trash", accountId)
        const junk = await client.mail.findRoleMailbox("junk", accountId)
        const emails = await client.mail.getEmailByIds(ids, { properties: ["id", "keywords", "mailboxIds"] }, accountId)
        const wake = emails.filter(email => email.keywords?.$snoozed && !email.mailboxIds[trash?.id ?? ""] && !email.mailboxIds[junk?.id ?? ""]).map(email => email.id)
        if (wake.length) { await client.mail.unarchive(wake, accountId); await client.mail.setKeywords(wake, { $snoozed: false }, accountId) }
      }
      await db.query("UPDATE mail_jobs SET status=$2, error=NULL, updated_at=now() WHERE id=$1", [row.id, row.kind === "send" ? "sent" : "completed"])
    } catch (error) {
      // A send error after network I/O may already have submitted; require review.
      const message = error instanceof Error ? error.message : "Mail operation failed."
      // Once submission starts, a timeout or interrupted response cannot
      // establish whether the server accepted it. Never offer blind retry.
      const status = row.kind === "send" && submissionAttempted ? "needs_review" : "failed"
      if (row.kind === "snooze" && row.attempts < 10 && !/authorization expired|account changed/i.test(message)) {
        await db.query("UPDATE mail_jobs SET status='queued', run_at=now() + ($2 * interval '1 minute'), error=$3, updated_at=now() WHERE id=$1", [row.id, Math.min(60, 2 ** row.attempts), message.slice(0, 250)])
      } else {
        await db.query("UPDATE mail_jobs SET status=$2, error=$3, updated_at=now() WHERE id=$1", [row.id, status, message.slice(0, 250)])
      }
    }
  }
  return rows.rowCount ?? 0
}
