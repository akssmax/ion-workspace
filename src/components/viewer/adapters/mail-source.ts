/**
 * Adapt a mail attachment part into a DocumentSource.
 */

import type { EmailBodyPart } from "@/jmap/types/mail"
import type { DocumentSource } from "../types"

export function mailAttachmentSource(
  attachment: EmailBodyPart,
  loadBlob: (blobId: string) => Promise<Blob>
): DocumentSource {
  const blobId = attachment.blobId ?? attachment.partId ?? attachment.name ?? "attachment"
  return {
    id: `mail:${blobId}`,
    name: attachment.name || "attachment",
    mime: attachment.type || "application/octet-stream",
    size: attachment.size,
    loadBlob: () => loadBlob(blobId),
  }
}
