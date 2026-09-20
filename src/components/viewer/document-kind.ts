/**
 * MIME/extension routing for the document viewer.
 *
 * Routing by kind (rather than one library) matches how Gmail/Drive decide
 * what to render. HTML is deliberately routed to `text` so markup is shown as
 * source, never executed.
 */

import { MAX_PREVIEW_BYTES } from "./types"
import type { DocumentKind } from "./types"

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

const IMAGE_EXT = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "svg",
  "avif",
  "ico",
  "tif",
  "tiff",
  "heic",
])

const SHEET_EXT = new Set(["xlsx", "xls", "csv", "ods"])

const TEXT_EXT = new Set([
  "txt",
  "md",
  "markdown",
  "json",
  "xml",
  "yaml",
  "yml",
  "log",
  "ini",
  "conf",
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "css",
  "scss",
  "html",
  "htm",
  "sh",
  "zsh",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "kt",
  "c",
  "h",
  "cpp",
  "cs",
  "php",
  "swift",
  "sql",
  "toml",
  "env",
  "diff",
  "patch",
])

export function extensionOf(name: string): string {
  const index = name.lastIndexOf(".")
  return index === -1 ? "" : name.slice(index + 1).toLowerCase()
}

export function kindForMime(mime: string, name = ""): DocumentKind {
  const value = (mime || "").toLowerCase()
  const ext = extensionOf(name)

  if (value.startsWith("image/") || IMAGE_EXT.has(ext)) return "image"
  if (value === "application/pdf" || ext === "pdf") return "pdf"
  if (value === DOCX_MIME || ext === "docx") return "docx"
  if (
    value === XLSX_MIME ||
    value === "application/vnd.ms-excel" ||
    value === "text/csv" ||
    SHEET_EXT.has(ext)
  )
    return "sheet"
  if (value.startsWith("audio/") || value.startsWith("video/")) return "media"
  if (
    value.startsWith("text/") ||
    value === "application/json" ||
    value === "application/xml" ||
    value === "application/javascript" ||
    TEXT_EXT.has(ext)
  )
    return "text"
  return "unsupported"
}

export function isPreviewable(
  mime: string,
  name = "",
  size?: number
): boolean {
  if (size && size > MAX_PREVIEW_BYTES) return false
  return kindForMime(mime, name) !== "unsupported"
}

const LANGUAGES: Record<string, string> = {
  json: "json",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  md: "markdown",
  markdown: "markdown",
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  css: "css",
  scss: "scss",
  html: "html",
  htm: "html",
  sh: "bash",
  zsh: "bash",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  c: "c",
  h: "c",
  cpp: "cpp",
  cs: "csharp",
  php: "php",
  swift: "swift",
  sql: "sql",
  toml: "toml",
  ini: "ini",
  conf: "ini",
  log: "text",
  diff: "diff",
  patch: "diff",
}

/** Shiki language id for a filename, or undefined for plain text. */
export function languageFor(name: string): string | undefined {
  return LANGUAGES[extensionOf(name)]
}
