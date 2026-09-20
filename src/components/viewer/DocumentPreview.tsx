/**
 * The MIME switcher: picks a renderer for the loaded document.
 */

import { kindForMime } from "./document-kind"
import { DocxRenderer } from "./renderers/DocxRenderer"
import { ImageRenderer } from "./renderers/ImageRenderer"
import { MediaRenderer } from "./renderers/MediaRenderer"
import { PdfRenderer } from "./renderers/PdfRenderer"
import { SheetRenderer } from "./renderers/SheetRenderer"
import { TextRenderer } from "./renderers/TextRenderer"
import { UnsupportedRenderer } from "./renderers/UnsupportedRenderer"
import type { DocumentSource } from "./types"

export function DocumentPreview({
  source,
  url,
  blob,
}: {
  source: DocumentSource
  url: string
  blob: Blob
}) {
  switch (kindForMime(source.mime, source.name)) {
    case "image":
      return <ImageRenderer source={source} url={url} />
    case "pdf":
      return <PdfRenderer source={source} url={url} />
    case "text":
      return <TextRenderer source={source} blob={blob} />
    case "media":
      return <MediaRenderer source={source} url={url} />
    case "docx":
      return <DocxRenderer source={source} blob={blob} />
    case "sheet":
      return <SheetRenderer source={source} blob={blob} />
    default:
      return <UnsupportedRenderer source={source} />
  }
}
