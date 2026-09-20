/**
 * PDF renderer backed by react-pdf (pdf.js).
 *
 * react-pdf and its worker are loaded on demand so they never enter the SSR
 * graph or the initial bundle.
 */

import { useEffect, useState } from "react"
import type { ComponentType } from "react"
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { useViewerControls } from "../controls"
import type { DocumentSource } from "../types"

interface ReactPdfModule {
  Document: ComponentType<Record<string, unknown>>
  Page: ComponentType<Record<string, unknown>>
  pdfjs: { GlobalWorkerOptions: { workerSrc: string } }
}

export function PdfRenderer({
  source,
  url,
}: {
  source: DocumentSource
  url: string
}) {
  const controls = useViewerControls()
  const [mod, setMod] = useState<ReactPdfModule | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const cancelled = { current: false }
    void Promise.all([
      import("react-pdf"),
      import("react-pdf/dist/Page/TextLayer.css"),
      import("react-pdf/dist/Page/AnnotationLayer.css"),
    ])
      .then(([pdf]) => {
        pdf.pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
        if (!cancelled.current) setMod(pdf)
      })
      .catch(() => {
        if (!cancelled.current) setError(true)
      })
    return () => {
      cancelled.current = true
    }
  }, [])

  if (error) {
    return (
      <p className="p-4 text-sm text-destructive">
        Could not load the PDF engine.
      </p>
    )
  }
  if (!mod) {
    return (
      <p className="p-4 text-sm text-muted-foreground">Loading PDF engine…</p>
    )
  }

  const { Document, Page } = mod
  return (
    <div
      className="h-full w-full overflow-auto p-4"
      aria-label={source.name}
    >
      <Document
        file={url}
        onLoadSuccess={(info: { numPages: number }) =>
          controls.setPageCount(info.numPages)
        }
        onLoadError={() => setError(true)}
        loading={
          <p className="p-4 text-sm text-muted-foreground">Loading PDF…</p>
        }
        error={
          <p className="p-4 text-sm text-destructive">
            Could not render this PDF.
          </p>
        }
        className="flex flex-col items-center gap-4"
      >
        <Page
          pageNumber={controls.page}
          scale={controls.zoom}
          rotate={controls.rotate}
          className="shadow-md"
          loading={<div className="h-64 w-full animate-pulse rounded bg-muted" />}
        />
      </Document>
    </div>
  )
}
