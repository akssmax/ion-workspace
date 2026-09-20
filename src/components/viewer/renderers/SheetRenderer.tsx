/**
 * Spreadsheet renderer: SheetJS parses the workbook and emits per-sheet table
 * HTML, which is DOMPurify-sanitized before injection.
 */

import { useEffect, useState } from "react"
import { sanitizeEmailHtml } from "@/lib/email-renderer"
import { cn } from "cn"
import { useViewerControls } from "../controls"
import type { DocumentSource } from "../types"

export function SheetRenderer({
  source,
  blob,
}: {
  source: DocumentSource
  blob: Blob
}) {
  const { zoom } = useViewerControls()
  const [sheets, setSheets] = useState<{ name: string; html: string }[] | null>(
    null
  )
  const [active, setActive] = useState(0)
  const [error, setError] = useState(false)

  useEffect(() => {
    const cancelled = { current: false }
    setSheets(null)
    setError(false)
    setActive(0)
    void (async () => {
      try {
        const XLSX = await import("xlsx")
        const workbook = XLSX.read(await blob.arrayBuffer(), { type: "array" })
        const parsed = workbook.SheetNames.map((name) => ({
          name,
          html: sanitizeEmailHtml(
            XLSX.utils.sheet_to_html(workbook.Sheets[name])
          ),
        }))
        if (!cancelled.current) setSheets(parsed)
      } catch {
        if (!cancelled.current) setError(true)
      }
    })()
    return () => {
      cancelled.current = true
    }
  }, [blob, source.id])

  if (error) {
    return (
      <p className="p-4 text-sm text-destructive">
        Could not render this spreadsheet.
      </p>
    )
  }
  if (!sheets) {
    return <p className="p-4 text-sm text-muted-foreground">Loading…</p>
  }

  return (
    <div className="flex h-full w-full flex-col">
      {sheets.length > 1 ? (
        <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b px-2 py-1">
          {sheets.map((sheet, index) => (
            <button
              key={sheet.name}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "rounded px-2 py-1 text-xs whitespace-nowrap hover:bg-muted",
                index === active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {sheet.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div
          className="[&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1"
          style={{ fontSize: `${13 * zoom}px` }}
          dangerouslySetInnerHTML={{ __html: sheets[active]?.html ?? "" }}
        />
      </div>
    </div>
  )
}
