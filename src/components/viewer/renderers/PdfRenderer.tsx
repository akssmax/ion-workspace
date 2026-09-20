/**
 * PDF renderer backed by react-pdf (pdf.js).
 *
 * react-pdf and its worker are loaded on demand so they never enter the SSR
 * graph or the initial bundle.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import type { ComponentType } from "react"
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { useViewerControls } from "../controls"
import { Spinner } from "@/components/ui/spinner"
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
  const pageCountRef = useRef(0)

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

  const onLoadSuccess = useCallback(
    (info: { numPages: number }) => {
      if (pageCountRef.current === info.numPages) return
      pageCountRef.current = info.numPages
      controls.setPageCount(info.numPages)
    },
    [controls]
  )

  if (error) {
    return (
      <p className="p-4 text-sm text-destructive">
        Could not load the PDF engine.
      </p>
    )
  }
  if (!mod) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Spinner /> Loading PDF engine…
      </div>
    )
  }

  const { Document, Page } = mod
  return (
    <div className="h-full w-full overflow-auto p-4" aria-label={source.name}>
      <Document
        file={url}
        // Without our own <Suspense> boundary, suspense must be disabled or the
        // document suspends indefinitely and repeatedly kills the worker.
        suspense={false}
        onLoadSuccess={onLoadSuccess}
        onLoadError={() => setError(true)}
        loading={
          <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
            <Spinner /> Loading PDF…
          </div>
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
          renderAnnotationLayer={false}
          loading={
            <div className="h-64 w-2/3 animate-pulse rounded bg-muted" />
          }
          className="shadow-md"
        />
      </Document>
    </div>
  )
}
