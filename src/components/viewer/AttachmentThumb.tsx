/**
 * Inline image thumbnail for an email attachment (rendered in the message
 * body); opens the full-screen viewer on click.
 */

import { ImageIcon } from "lucide-react"
import { cn } from "cn"
import { useDocumentBlob } from "./use-document-blob"
import type { DocumentSource } from "./types"

export function AttachmentThumb({
  source,
  onOpen,
  className,
}: {
  source: DocumentSource
  onOpen: () => void
  className?: string
}) {
  const { url } = useDocumentBlob(source)
  return (
    <button
      type="button"
      onClick={onOpen}
      title={source.name}
      className={cn(
        "group relative size-28 overflow-hidden rounded-lg border bg-muted/40 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      {url ? (
        <img
          src={url}
          alt={source.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          <ImageIcon className="size-5 text-muted-foreground" />
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
        {source.name}
      </span>
    </button>
  )
}
