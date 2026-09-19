import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto"
import { lookup } from "node:dns/promises"
import { isIP } from "node:net"
import { Agent, request } from "undici"
import { mailMetadataPool } from "./mail-metadata.server"
import { parseCalendarFile } from "@/lib/ical-import"
import type { CalendarEvent } from "@/jmap/types/calendar"

export interface FeedRecord {
  id: string
  name: string
  color: string
  events: Partial<CalendarEvent>[]
  refreshedAt: string | null
  error: string | null
}
type Owner = { userId: string; accountId?: string }
const scope = (owner: Owner) => [owner.userId, owner.accountId ?? "primary"]
const pool = () => {
  const value = mailMetadataPool()
  if (!value)
    throw new Error("DATABASE_URL is required for calendar subscriptions.")
  return value
}
function key() {
  const secret =
    process.env.CALENDAR_FEED_ENCRYPTION_KEY || process.env.SESSION_SECRET
  if (!secret)
    throw new Error(
      "Set CALENDAR_FEED_ENCRYPTION_KEY for calendar subscriptions."
    )
  return createHash("sha256").update(secret).digest()
}
function seal(value: string) {
  const nonce = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), nonce)
  return Buffer.concat([
    nonce,
    cipher.update(value),
    cipher.final(),
    cipher.getAuthTag(),
  ]).toString("base64")
}
function unseal(value: string) {
  const data = Buffer.from(value, "base64")
  const decipher = createDecipheriv("aes-256-gcm", key(), data.subarray(0, 12))
  decipher.setAuthTag(data.subarray(-16))
  return Buffer.concat([
    decipher.update(data.subarray(12, -16)),
    decipher.final(),
  ]).toString()
}
function blockedIp(address: string) {
  if (address.includes(":")) return !/^(2|3)[0-9a-f]{3}:/i.test(address) // block local, mapped and non-global IPv6
  const p = address.split(".").map(Number)
  return (
    p[0] === 0 ||
    p[0] === 10 ||
    p[0] === 127 ||
    p[0] >= 224 ||
    (p[0] === 169 && p[1] === 254) ||
    (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
    (p[0] === 192 && p[1] === 168) ||
    (p[0] === 100 && p[1] >= 64 && p[1] <= 127) ||
    (p[0] === 192 && p[1] === 0)
  )
}
export async function checkedFeedUrl(raw: string): Promise<URL> {
  const normalized = raw.replace(/^webcal:\/\//i, "https://")
  const url = new URL(normalized)
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443")
  )
    throw new Error("Use a public HTTPS iCal URL.")
  if (
    isIP(url.hostname) ||
    url.hostname === "localhost" ||
    !url.hostname.includes(".")
  )
    throw new Error("Use a public HTTPS iCal URL.")
  const records = await lookup(url.hostname, { all: true })
  if (!records.length || records.some((record) => blockedIp(record.address)))
    throw new Error("This calendar URL cannot be fetched.")
  return url
}
async function fetchFeed(
  raw: string,
  etag?: string | null,
  modified?: string | null
) {
  let url = await checkedFeedUrl(raw)
  for (let hop = 0; hop < 4; hop++) {
    const address = (await lookup(url.hostname, { all: true }))[0]
    if (!address || blockedIp(address.address))
      throw new Error("This calendar URL cannot be fetched.")
    const dispatcher = new Agent({
      connect: {
        lookup: (_host, _options, callback) =>
          callback(null, address.address, address.family),
      },
    })
    try {
      const response = await request(url, {
        dispatcher,
        signal: AbortSignal.timeout(15_000),
        headers: {
          Accept: "text/calendar",
          ...(etag ? { "If-None-Match": etag } : {}),
          ...(modified ? { "If-Modified-Since": modified } : {}),
        },
      })
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        const location = response.headers.location
        if (!location || Array.isArray(location))
          throw new Error("Calendar feed redirected without a location.")
        url = await checkedFeedUrl(new URL(location, url).toString())
        continue
      }
      if (response.statusCode === 304) return { unchanged: true as const }
      if (response.statusCode < 200 || response.statusCode >= 300)
        throw new Error(`Calendar feed returned ${response.statusCode}.`)
      const length = Number(response.headers["content-length"] || 0)
      if (length > 10_000_000) throw new Error("Calendar feed exceeds 10 MB.")
      const chunks: Buffer[] = []
      let bytes = 0
      for await (const chunk of response.body) {
        bytes += chunk.length
        if (bytes > 10_000_000) throw new Error("Calendar feed exceeds 10 MB.")
        chunks.push(Buffer.from(chunk))
      }
      const body = Buffer.concat(chunks).toString("utf8")
      const parsed = parseCalendarFile(body)
      if (parsed.errors.length)
        throw new Error(
          `${parsed.errors.length} calendar entries could not be parsed.`
        )
      return {
        unchanged: false as const,
        events: parsed.events,
        etag:
          typeof response.headers.etag === "string"
            ? response.headers.etag
            : null,
        modified:
          typeof response.headers["last-modified"] === "string"
            ? response.headers["last-modified"]
            : null,
      }
    } finally {
      await dispatcher.close()
    }
  }
  throw new Error("Calendar feed redirected too many times.")
}
export async function listFeeds(owner: Owner): Promise<FeedRecord[]> {
  const result = await pool().query<{
    id: string
    name: string
    color: string
    events: Partial<CalendarEvent>[]
    refreshed_at: Date | null
    error: string | null
  }>(
    "SELECT id, name, color, events, refreshed_at, error FROM calendar_feeds WHERE user_id=$1 AND account_id=$2 ORDER BY created_at",
    scope(owner)
  )
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    events: row.events,
    refreshedAt: row.refreshed_at?.toISOString() ?? null,
    error: row.error,
  }))
}
export async function addFeed(
  owner: Owner,
  data: { name: string; url: string; color?: string }
) {
  if (!data.name.trim() || data.name.length > 100)
    throw new Error("Enter a feed name under 100 characters.")
  const url = await checkedFeedUrl(data.url)
  const id = randomUUID()
  await pool().query(
    "INSERT INTO calendar_feeds (id,user_id,account_id,name,color,url_ciphertext) VALUES ($1,$2,$3,$4,$5,$6)",
    [
      id,
      ...scope(owner),
      data.name.trim(),
      /^#[0-9a-f]{6}$/i.test(data.color || "") ? data.color : "#64748b",
      seal(url.toString()),
    ]
  )
  try {
    await refreshFeed(id, owner)
  } catch {
    /* Keep the subscription and its visible error for retry. */
  }
  return id
}
export async function removeFeed(owner: Owner, id: string) {
  await pool().query(
    "DELETE FROM calendar_feeds WHERE id=$1 AND user_id=$2 AND account_id=$3",
    [id, ...scope(owner)]
  )
}
export async function refreshFeed(id: string, owner?: Owner) {
  const result = await pool().query<{
    url_ciphertext: string
    etag: string | null
    last_modified: string | null
    fail_count: number
  }>(
    `SELECT url_ciphertext,etag,last_modified,fail_count FROM calendar_feeds WHERE id=$1 ${owner ? "AND user_id=$2 AND account_id=$3" : ""}`,
    owner ? [id, ...scope(owner)] : [id]
  )
  const item = result.rows[0]
  if (!item) throw new Error("Calendar feed not found.")
  try {
    const content = await fetchFeed(
      unseal(item.url_ciphertext),
      item.etag,
      item.last_modified
    )
    if (content.unchanged)
      await pool().query(
        "UPDATE calendar_feeds SET refreshed_at=now(), next_refresh_at=now()+interval '1 hour', error=NULL, fail_count=0 WHERE id=$1",
        [id]
      )
    else
      await pool().query(
        "UPDATE calendar_feeds SET events=$2::jsonb, etag=$3, last_modified=$4, refreshed_at=now(), next_refresh_at=now()+interval '1 hour', error=NULL, fail_count=0 WHERE id=$1",
        [id, JSON.stringify(content.events), content.etag, content.modified]
      )
  } catch (cause) {
    const count = Math.min(item.fail_count + 1, 6)
    await pool().query(
      "UPDATE calendar_feeds SET error=$2, fail_count=$3, next_refresh_at=now()+($4 * interval '1 minute') WHERE id=$1",
      [
        id,
        cause instanceof Error
          ? cause.message.replace(/https?:\/\/\S+/g, "[feed URL]")
          : "Refresh failed",
        count,
        Math.min(60, 5 * 2 ** count),
      ]
    )
    throw new Error(
      cause instanceof Error
        ? cause.message.replace(/https?:\/\/\S+/g, "[feed URL]")
        : "Calendar feed refresh failed."
    )
  }
}
export async function refreshDueFeeds() {
  const due = await pool().query<{ id: string }>(
    "SELECT id FROM calendar_feeds WHERE next_refresh_at <= now() ORDER BY next_refresh_at LIMIT 100"
  )
  for (const row of due.rows) {
    try {
      await refreshFeed(row.id)
    } catch {
      /* retain last good snapshot */
    }
  }
  return due.rowCount
}
