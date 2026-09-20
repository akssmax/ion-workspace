/**
 * Full-screen document viewer shared by Mail attachments and Files.
 *
 * Renders over the current app, routes by MIME, and supports keyboard
 * navigation (Esc close, arrows for items/pages, +/- zoom, 0 reset).
 */

import { useEffect, useMemo, useState } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { downloadBlob } from "@/lib/attachments"
import { ViewerControlsContext } from "./controls"
import { kindForMime } from "./document-kind"
import { DocumentPreview } from "./DocumentPreview"
import { formatFileSize } from "./format"
import { UnsupportedRenderer } from "./renderers/UnsupportedRenderer"
import { MAX_PREVIEW_BYTES } from "./types"
import type { DocumentSource, ViewerControls } from "./types"
import { useDocumentBlob } from "./use-document-blob"

export interface DocumentViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: DocumentSource[]
  index: number
  onIndexChange?: (index: number) => void
  title?: string
}

export function DocumentViewer({
  open,
  onOpenChange,
  items,
  index,
  onIndexChange,
  title,
}: DocumentViewerProps) {
  const source = items[index] ?? null
  const { url, blob, loading, error, reload } = useDocumentBlob(
    open ? source : null
  )
  const [zoom, setZoom] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(0)

  const kind = source ? kindForMime(source.mime, source.name) : "unsupported"
  const oversize = !!source?.size && source.size > MAX_PREVIEW_BYTES
  const previewable = !!source && !oversize && kind !== "unsupported"
  const multiple = items.length > 1

  useEffect(() => {
    setZoom(1)
    setRotate(0)
    setPage(1)
    setPageCount(0)
  }, [source?.id])

  const go = (delta: number) => {
    if (!onIndexChange || !multiple) return
    onIndexChange((index + delta + items.length) % items.length)
  }

  const controls: ViewerControls = useMemo(
    () => ({
      zoom,
      setZoom,
      rotate,
      rotateBy: (delta: number) => setRotate((value) => (value + delta + 360) % 360),
      page,
      setPage,
      pageCount,
      setPageCount,
    }),
    [zoom, rotate, page, pageCount]
  )

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowRight" && multiple) {
      event.preventDefault()
      go(1)
    } else if (event.key === "ArrowLeft" && multiple) {
      event.preventDefault()
      go(-1)
    } else if (kind === "pdf" && (event.key === "ArrowDown" || event.key === "PageDown")) {
      event.preventDefault()
      setPage((value) => Math.min(pageCount || 1, value + 1))
    } else if (kind === "pdf" && (event.key === "ArrowUp" || event.key === "PageUp")) {
      event.preventDefault()
      setPage((value) => Math.max(1, value - 1))
    } else if (event.key === "+" || event.key === "=") {
      setZoom((value) => Math.min(4, Math.round((value + 0.25) * 100) / 100))
    } else if (event.key === "-") {
      setZoom((value) => Math.max(0.25, Math.round((value - 0.25) * 100) / 100))
    } else if (event.key === "0") {
      setZoom(1)
    }
  }

  const showZoom = previewable && (kind === "image" || kind === "pdf" || kind === "text" || kind === "docx" || kind === "sheet")
  const showRotate = previewable && (kind === "image" || kind === "pdf")
  const showPages = previewable && kind === "pdf" && pageCount > 1

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/70 duration-100 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-50 flex flex-col bg-background text-foreground outline-none"
        >
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {source?.name ?? title ?? "Preview"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {[source?.mime, formatFileSize(source?.size)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>

            <div className="ms-auto flex items-center gap-0.5">
              {showZoom ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Zoom out"
                    onClick={() =>
                      setZoom((value) =>
                        Math.max(0.25, Math.round((value - 0.25) * 100) / 100)
                      )
                    }
                  >
                    <ZoomOut className="size-4" />
                  </Button>
                  <span className="w-10 text-center text-xs text-muted-foreground tabular-nums">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Zoom in"
                    onClick={() =>
                      setZoom((value) =>
                        Math.min(4, Math.round((value + 0.25) * 100) / 100)
                      )
                    }
                  >
                    <ZoomIn className="size-4" />
                  </Button>
                </>
              ) : null}
              {showRotate ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Rotate"
                  onClick={() => setRotate((value) => (value + 90) % 360)}
                >
                  <RotateCw className="size-4" />
                </Button>
              ) : null}
              {showPages ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Previous page"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {page} / {pageCount}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Next page"
                    disabled={page >= pageCount}
                    onClick={() =>
                      setPage((value) => Math.min(pageCount, value + 1))
                    }
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </>
              ) : null}

              {url && previewable ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Open in new tab"
                  onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="size-4" />
                </Button>
              ) : null}
              {blob && source ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Download"
                  onClick={() => downloadBlob(blob, source.name)}
                >
                  <Download className="size-4" />
                </Button>
              ) : null}
              <DialogPrimitive.Close
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Close preview"
                  />
                }
              >
                <X className="size-4" />
              </DialogPrimitive.Close>
            </div>
          </header>

          <div className="relative min-h-0 flex-1">
            {previewable ? (
              <ViewerControlsContext.Provider value={controls}>
                <ViewerBody
                  source={source!}
                  url={url}
                  blob={blob}
                  loading={loading}
                  error={error}
                  onRetry={reload}
                />
              </ViewerControlsContext.Provider>
            ) : source ? (
              <UnsupportedRenderer
                source={source}
                reason={
                  oversize
                    ? `Too large to preview (over ${formatFileSize(MAX_PREVIEW_BYTES)}).`
                    : undefined
                }
              />
            ) : null}
          </div>

          {multiple ? (
            <footer className="flex h-12 shrink-0 items-center justify-center gap-3 border-t text-xs text-muted-foreground">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Previous attachment"
                onClick={() => go(-1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="tabular-nums">
                {index + 1} of {items.length}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Next attachment"
                onClick={() => go(1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </footer>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function ViewerBody({
  source,
  url,
  blob,
  loading,
  error,
  onRetry,
}: {
  source: DocumentSource
  url: string | null
  blob: Blob | null
  loading: boolean
  error: unknown
  onRetry: () => void
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Spinner /> Loading preview…
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p role="alert" className="text-sm text-destructive">
          {error instanceof Error && error.message
            ? `Could not load this file: ${error.message}`
            : "Could not load this file."}
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    )
  }
  if (!url || !blob) return null
  return <DocumentPreview source={source} url={url} blob={blob} />
}
