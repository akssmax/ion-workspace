import type { DocumentSource } from "../types"

export function MediaRenderer({
  source,
  url,
}: {
  source: DocumentSource
  url: string
}) {
  const isVideo = source.mime.startsWith("video/")
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      {isVideo ? (
        <video
          src={url}
          controls
          className="max-h-full max-w-full rounded-lg bg-black"
        >
          <track kind="captions" />
        </video>
      ) : (
        <audio src={url} controls className="w-full max-w-xl" />
      )}
    </div>
  )
}
