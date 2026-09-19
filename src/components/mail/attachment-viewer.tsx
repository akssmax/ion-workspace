import { useEffect, useState } from "react"
import { Download, ExternalLink, FileText } from "lucide-react"
import type { EmailBodyPart } from "@/jmap/types/mail"
import { useDownloadAttachment } from "@/queries/mail"
import { Button } from "@/components/ui/button"
import { usePreferences } from "@/queries/preferences"
import { filenameDefaults, formatMailFilename } from "@/lib/mail-filenames"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function AttachmentViewer({
  attachment,
  onClose,
  subject,
  sender,
}: {
  attachment: EmailBodyPart | null
  onClose: () => void
  subject?: string
  sender?: string
}) {
  const { data: preferences } = usePreferences()
  const download = useDownloadAttachment()
  const [url, setUrl] = useState<string | null>(null)
  const [plainText, setPlainText] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const blobId = attachment?.blobId ?? null
  const contentType = attachment?.type ?? "application/octet-stream"
  const previewable =
    contentType.startsWith("image/") ||
    contentType === "application/pdf" ||
    contentType.startsWith("text/")

  useEffect(() => {
    if (!blobId || !previewable) return
    let cancelled = false
    let objectUrl: string | null = null
    void download
      .mutateAsync(blobId)
      .then(async (blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
        if (contentType.startsWith("text/")) setPlainText(await blob.text())
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setUrl(null)
      setPlainText(null)
      setError(false)
    }
  }, [blobId, previewable, contentType, download.mutateAsync])

  async function save() {
    if (!blobId) return
    try {
      const blob = await download.mutateAsync(blobId)
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = formatMailFilename("attachment", preferences?.attachmentFilenameTemplate ?? filenameDefaults.attachment, { filename: attachment?.name ?? "attachment", subject, fromEmail: sender }, preferences?.filenameSpaces)
      link.click()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch {
      setError(true)
    }
  }

  return (
    <Dialog
      open={!!attachment}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">
            {attachment?.name || "Attachment"}
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-40 flex-1 overflow-auto rounded-lg border bg-muted/30 p-2">
          {error ? (
            <p role="alert" className="p-4 text-sm text-destructive">
              Could not load this attachment.
            </p>
          ) : !previewable ? (
            <p className="flex items-center gap-2 p-4 text-sm">
              <FileText className="size-5" /> Preview unavailable for this file
              type.
            </p>
          ) : !url ? (
            <p className="p-4 text-sm text-muted-foreground">
              Loading preview…
            </p>
          ) : contentType.startsWith("image/") ? (
            <img
              src={url}
              alt={attachment?.name || "Attached image"}
              className="mx-auto max-h-[65vh] max-w-full object-contain"
            />
          ) : contentType === "application/pdf" ? (
            <iframe
              title={attachment?.name || "PDF preview"}
              src={url}
              sandbox=""
              className="h-[65vh] w-full"
            />
          ) : (
            <pre className="max-h-[65vh] overflow-auto p-3 text-sm whitespace-pre-wrap">
              {plainText}
            </pre>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {attachment?.type || "File"}
            {attachment?.size
              ? ` · ${Math.ceil(attachment.size / 1024)} KB`
              : ""}
          </span>
          <Button
            size="sm"
            className="ml-auto"
            disabled={!blobId}
            onClick={() => void save()}
          >
            <Download className="size-4" /> Download
          </Button>
          {url && !contentType.startsWith("text/") ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="size-4" /> Open
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
