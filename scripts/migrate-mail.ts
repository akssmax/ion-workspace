import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { Pool } from "pg"

if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL before migrating.")
const database = new Pool({ connectionString: process.env.DATABASE_URL })
try {
  for (const name of ["001_mail_metadata.sql", "002_user_preferences.sql", "003_calendar_feeds.sql", "004_mail_jobs.sql"]) {
    const file = fileURLToPath(new URL(`../migrations/${name}`, import.meta.url))
    await database.query(readFileSync(file, "utf8"))
  }
  process.stdout.write("Workspace metadata schema is ready.\n")
} finally {
  await database.end()
}
