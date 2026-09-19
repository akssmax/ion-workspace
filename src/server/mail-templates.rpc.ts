import { randomUUID } from "node:crypto"
import { createServerFn } from "@tanstack/react-start"
import { requireSession } from "./session.server"
import {
  mailMetadataAvailable,
  requireMailMetadata,
} from "./mail-metadata.server"

export interface MailTemplate {
  id: string
  name: string
  subject: string
  htmlBody: string
  createdAt: string
}

function accountScope(session: { userId: string; accountId?: string }) {
  return [session.userId, session.accountId ?? "primary"]
}

export const templatesAvailable = createServerFn({ method: "GET" }).handler(
  async () => mailMetadataAvailable()
)

export const listMailTemplates = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await requireSession()
    if (!(await mailMetadataAvailable())) return [] as MailTemplate[]
    const result = await requireMailMetadata().query<{
      id: string
      name: string
      subject: string
      html_body: string
      created_at: Date
    }>(
      `SELECT id, name, subject, html_body, created_at FROM mail_templates
     WHERE user_id = $1 AND account_id = $2 ORDER BY name, id`,
      accountScope(session)
    )
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      subject: row.subject,
      htmlBody: row.html_body,
      createdAt: row.created_at.toISOString(),
    }))
  }
)

export const saveMailTemplate = createServerFn({ method: "POST" })
  .validator(
    (input: unknown) =>
      input as { id?: string; name: string; subject: string; htmlBody: string }
  )
  .handler(async ({ data }) => {
    const session = await requireSession()
    if (
      typeof data.name !== "string" ||
      typeof data.subject !== "string" ||
      typeof data.htmlBody !== "string" ||
      !data.name.trim() ||
      data.name.length > 120 ||
      data.subject.length > 500 ||
      data.htmlBody.length > 200_000
    ) {
      throw new Error("Check the template name or content length.")
    }
    const [userId, accountId] = accountScope(session)
    const database = requireMailMetadata()
    if (data.id) {
      const updated = await database.query(
        `UPDATE mail_templates SET name = $4, subject = $5, html_body = $6
         WHERE id = $1 AND user_id = $2 AND account_id = $3 RETURNING id`,
        [
          data.id,
          userId,
          accountId,
          data.name.trim(),
          data.subject,
          data.htmlBody,
        ]
      )
      if (!updated.rowCount) throw new Error("Template not found.")
      return { id: data.id }
    }
    const id = randomUUID()
    await database.query(
      `INSERT INTO mail_templates (id, user_id, account_id, name, subject, html_body)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, userId, accountId, data.name.trim(), data.subject, data.htmlBody]
    )
    return { id }
  })

export const deleteMailTemplate = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { id: string })
  .handler(async ({ data }) => {
    const session = await requireSession()
    await requireMailMetadata().query(
      "DELETE FROM mail_templates WHERE id = $1 AND user_id = $2 AND account_id = $3",
      [data.id, ...accountScope(session)]
    )
    return { ok: true }
  })
