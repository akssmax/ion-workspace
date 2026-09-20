import { FileQuestion } from "lucide-react"
import { formatFileSize } from "../format"
import type { DocumentSource } from "../types"

export function UnsupportedRenderer({
  source,
  reason,
}: {
  source: DocumentSource
  reason?: string
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <FileQuestion className="size-7" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{source.name}</p>
        <p className="text-xs text-muted-foreground">
          {reason ?? "Preview isn't available for this file type."}
        </p>
        {source.size ? (
          <p className="text-xs text-muted-foreground">
            {formatFileSize(source.size)}
          </p>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Use Download or Open in the toolbar to view it.
      </p>
    </div>
  )
}
