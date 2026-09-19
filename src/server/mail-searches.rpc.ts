import { randomUUID } from "node:crypto"
import { createServerFn } from "@tanstack/react-start"
import { requireSession } from "./session.server"
import {
  mailMetadataAvailable,
  requireMailMetadata,
} from "./mail-metadata.server"

export interface SavedMailSearch {
  id: string
  name: string
  query: string
}

export const listSavedMailSearches = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await requireSession()
    if (!(await mailMetadataAvailable())) return [] as SavedMailSearch[]
    const result = await requireMailMetadata().query<SavedMailSearch>(
      "SELECT id, name, query FROM mail_saved_searches WHERE user_id = $1 AND account_id = $2 ORDER BY name, id",
      [session.userId, session.accountId ?? "primary"]
    )
    return result.rows
  }
)

export const saveMailSearch = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { name: string; query: string })
  .handler(async ({ data }) => {
    const session = await requireSession()
    if (
      typeof data.name !== "string" ||
      typeof data.query !== "string" ||
      !data.name.trim() ||
      !data.query.trim() ||
      data.name.length > 120 ||
      data.query.length > 1000
    ) {
      throw new Error("Search name and query are required.")
    }
    const id = randomUUID()
    await requireMailMetadata().query(
      "INSERT INTO mail_saved_searches (id, user_id, account_id, name, query) VALUES ($1, $2, $3, $4, $5)",
      [
        id,
        session.userId,
        session.accountId ?? "primary",
        data.name.trim(),
        data.query.trim(),
      ]
    )
    return { id }
  })

export const deleteMailSearch = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { id: string })
  .handler(async ({ data }) => {
    const session = await requireSession()
    await requireMailMetadata().query(
      "DELETE FROM mail_saved_searches WHERE id = $1 AND user_id = $2 AND account_id = $3",
      [data.id, session.userId, session.accountId ?? "primary"]
    )
    return { ok: true }
  })
