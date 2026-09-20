/**
 * Word (.docx) renderer: mammoth converts to HTML, DOMPurify sanitizes before
 * it is injected. Legacy `.doc` is not supported and routes to `unsupported`.
 */

import { useEffect, useState } from "react"
import { sanitizeEmailHtml } from "@/lib/email-renderer"
import { Spinner } from "@/components/ui/spinner"
import { useViewerControls } from "../controls"
import type { DocumentSource } from "../types"

export function DocxRenderer({
  source,
  blob,
}: {
  source: DocumentSource
  blob: Blob
}) {
  const { zoom } = useViewerControls()
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const cancelled = { current: false }
    setHtml(null)
    setError(false)
    void (async () => {
      try {
        const mammoth = await import("mammoth")
        const arrayBuffer = await blob.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })
        if (!cancelled.current) setHtml(sanitizeEmailHtml(result.value))
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
        Could not render this document.
      </p>
    )
  }
  if (html === null) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Spinner /> Loading…
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-auto p-6">
      <div
        className="email-body mx-auto max-w-3xl"
        style={{ fontSize: `${15 * zoom}px` }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
