/**
 * Blob loading for the document viewer.
 *
 * Blobs are fetched through the app's server proxy (no public URL exists), so
 * requests are deduped per document id and the resulting object URL is revoked
 * when the consumer unmounts.
 */

import { useCallback, useEffect, useState } from "react"
import type { DocumentSource } from "./types"

const blobCache = new Map<string, Promise<Blob>>()

/** Start (or reuse) a blob fetch for a source. */
export function primeDocumentBlob(source: DocumentSource): Promise<Blob> {
  const existing = blobCache.get(source.id)
  if (existing) return existing
  const promise = source.loadBlob().catch((error) => {
    blobCache.delete(source.id)
    throw error
  })
  blobCache.set(source.id, promise)
  return promise
}

export function forgetDocumentBlob(id: string): void {
  blobCache.delete(id)
}

export interface DocumentBlobState {
  url: string | null
  blob: Blob | null
  loading: boolean
  error: unknown
  reload: () => void
}

/** Load a source into an object URL with loading/error/retry state. */
export function useDocumentBlob(
  source: DocumentSource | null
): DocumentBlobState {
  const [state, setState] = useState<{
    url: string | null
    blob: Blob | null
    loading: boolean
    error: unknown
  }>({ url: null, blob: null, loading: false, error: null })
  const [nonce, setNonce] = useState(0)
  const sourceId = source?.id ?? null

  useEffect(() => {
    if (!source) {
      setState({ url: null, blob: null, loading: false, error: null })
      return
    }
    const cancelled = { current: false }
    let objectUrl: string | null = null
    setState({ url: null, blob: null, loading: true, error: null })
    primeDocumentBlob(source)
      .then((blob) => {
        if (cancelled.current) return
        objectUrl = URL.createObjectURL(blob)
        setState({ url: objectUrl, blob, loading: false, error: null })
      })
      .catch((error) => {
        if (!cancelled.current)
          setState({ url: null, blob: null, loading: false, error })
      })
    return () => {
      cancelled.current = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // `sourceId` is the identity that matters; `source` is read at effect time.
  }, [sourceId, nonce])

  const reload = useCallback(() => {
    if (sourceId) forgetDocumentBlob(sourceId)
    setNonce((value) => value + 1)
  }, [sourceId])

  return { ...state, reload }
}
