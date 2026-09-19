/**
 * Attachment helpers: sizing, icons, and safe download handling.
 */

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

const ICONS: Record<string, string> = {
  pdf: "file-text",
  doc: "file-text",
  docx: "file-text",
  xls: "file-spreadsheet",
  xlsx: "file-spreadsheet",
  csv: "file-spreadsheet",
  png: "file-image",
  jpg: "file-image",
  jpeg: "file-image",
  gif: "file-image",
  svg: "file-image",
  webp: "file-image",
  zip: "file-archive",
  gz: "file-archive",
  tar: "file-archive",
  rar: "file-archive",
  mp4: "file-video",
  mov: "file-video",
  mp3: "file-audio",
  wav: "file-audio",
  txt: "file-text",
  md: "file-text",
  json: "file-code",
  xml: "file-code",
}

export function fileIconFor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  return ICONS[ext] ?? "file"
}

/** Trigger a browser download for a blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Sniff a friendly category label for a mime type. */
export function categoryFor(mime: string): string {
  if (mime.startsWith("image/")) return "Image"
  if (mime.startsWith("video/")) return "Video"
  if (mime.startsWith("audio/")) return "Audio"
  if (mime.includes("pdf")) return "PDF"
  if (mime.includes("zip") || mime.includes("tar") || mime.includes("gzip"))
    return "Archive"
  if (mime.startsWith("text/")) return "Text"
  return "File"
}
