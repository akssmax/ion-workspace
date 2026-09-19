/** App-owned mail metadata. Email objects themselves remain in JMAP. */
import { Pool } from "pg"

let pool: Pool | null = null

export function mailMetadataPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 8 })
  return pool
}

export async function mailMetadataAvailable(): Promise<boolean> {
  const database = mailMetadataPool()
  if (!database) return false
  try {
    const result = await database.query<{ available: boolean }>(
      "SELECT to_regclass('public.mail_templates') IS NOT NULL AND to_regclass('public.mail_saved_searches') IS NOT NULL AS available"
    )
    return result.rows[0]?.available === true
  } catch {
    return false
  }
}

export function requireMailMetadata(): Pool {
  const database = mailMetadataPool()
  if (!database) throw new Error("Mail metadata storage is not configured.")
  return database
}
