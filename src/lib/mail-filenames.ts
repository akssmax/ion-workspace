export type FilenameKind = "eml" | "attachment" | "zip"

export const filenameDefaults = {
  eml: "{date_short} ({from}-{to}) {subject}",
  attachment: "{filename}",
  zip: "emails-{count}",
} as const

export interface FilenameValues {
  date?: Date
  from?: string
  fromEmail?: string
  to?: string
  toEmail?: string
  subject?: string
  filename?: string
  count?: number
}

const tokens = new Set(["date", "date_short", "time", "year", "month", "day", "from", "from_email", "from_name", "to", "to_email", "to_name", "subject", "filename", "name", "ext", "count"])

export function formatMailFilename(kind: FilenameKind, template: string, values: FilenameValues, spaces: "keep" | "dash" | "underscore" = "keep"): string {
  const date = values.date ?? new Date()
  const original = values.filename ?? "attachment"
  const dot = original.lastIndexOf(".")
  const extension = dot > 0 ? original.slice(dot + 1) : ""
  const baseName = dot > 0 ? original.slice(0, dot) : original
  const parts: Record<string, string> = {
    date: `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())} ${two(date.getHours())}.${two(date.getMinutes())}.${two(date.getSeconds())}`,
    date_short: `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`,
    time: `${two(date.getHours())}.${two(date.getMinutes())}.${two(date.getSeconds())}`,
    year: String(date.getFullYear()), month: two(date.getMonth() + 1), day: two(date.getDate()),
    from: values.from ?? values.fromEmail ?? "sender", from_email: values.fromEmail ?? "", from_name: values.from ?? "",
    to: values.to ?? values.toEmail ?? "recipient", to_email: values.toEmail ?? "", to_name: values.to ?? "",
    subject: values.subject ?? "message", filename: original, name: baseName, ext: extension, count: String(values.count ?? 1),
  }
  const formatted = (template || filenameDefaults[kind]).replace(/\{([^}]+)\}/g, (match, name: string) => tokens.has(name) ? parts[name] : match)
  const safe = formatted.replace(/[\x00-\x1f<>:"/\\|?*]/g, "-").replace(/\s+/g, " ").replace(/^[. ]+|[. ]+$/g, "")
  const spaced = spaces === "keep" ? safe : safe.replaceAll(" ", spaces === "dash" ? "-" : "_")
  const suffix = kind === "eml" ? ".eml" : kind === "zip" ? ".zip" : extension && !spaced.toLowerCase().endsWith(`.${extension.toLowerCase()}`) ? `.${extension}` : ""
  return `${(spaced || kind).slice(0, 180)}${suffix}`
}

function two(value: number): string { return String(value).padStart(2, "0") }
