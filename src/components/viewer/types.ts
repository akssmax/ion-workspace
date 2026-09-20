/**
 * Shared document preview types.
 *
 * A `DocumentSource` is a lazy handle to a blob plus the metadata needed to
 * pick a renderer. Mail attachments and Files nodes both adapt into this shape
 * so the viewer is agnostic to where the bytes come from.
 */

export interface DocumentSource {
  /** Stable identity used for caching and React keys, e.g. `mail:blob-1`. */
  id: string
  name: string
  mime: string
  size?: number
  /** Fetch the bytes. Cached per id for the session (see `use-document-blob`). */
  loadBlob: () => Promise<Blob>
}

export type DocumentKind =
  | "image"
  | "pdf"
  | "text"
  | "media"
  | "docx"
  | "sheet"
  | "unsupported"

/** Maximum size rendered inline; larger files are download-only. */
export const MAX_PREVIEW_BYTES = 25 * 1024 * 1024

/** Shared page/zoom state owned by the viewer and consumed by renderers. */
export interface ViewerControls {
  zoom: number
  setZoom: (zoom: number) => void
  rotate: number
  rotateBy: (delta: number) => void
  page: number
  setPage: (page: number) => void
  pageCount: number
  setPageCount: (count: number) => void
}
