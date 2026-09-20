import { useEffect, useRef, useState } from "react"
import { Spinner } from "@/components/ui/spinner"
import { useViewerControls } from "../controls"
import { languageFor } from "../document-kind"
import type { DocumentSource } from "../types"

const MAX_HIGHLIGHT_CHARS = 200_000

export function TextRenderer({
  source,
  blob,
}: {
  source: DocumentSource
  blob: Blob
}) {
  const { zoom } = useViewerControls()
  const [text, setText] = useState<string | null>(null)
  const [html, setHtml] = useState<string | null>(null)

  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    setText(null)
    setHtml(null)
    void blob.text().then(async (value) => {
      if (!alive.current) return
      setText(value)
      const lang = languageFor(source.name)
      if (!lang || value.length > MAX_HIGHLIGHT_CHARS) return
      try {
        const { codeToHtml } = await import("shiki/bundle/web")
        const dark = document.documentElement.classList.contains("dark")
        const highlighted = await codeToHtml(value, {
          lang,
          theme: dark ? "github-dark" : "github-light",
        })
        if (alive.current) setHtml(highlighted)
      } catch {
        // Highlighting is best-effort; plain text remains.
      }
    })
    return () => {
      alive.current = false
    }
  }, [blob, source.name])

  if (text === null) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Spinner /> Loading…
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-auto p-4">
      {html ? (
        <div
          className="overflow-x-auto text-[13px] leading-relaxed [&_code]:font-mono [&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:p-0"
          style={{ fontSize: `${13 * zoom}px` }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre
          className="font-mono leading-relaxed whitespace-pre-wrap"
          style={{ fontSize: `${13 * zoom}px` }}
        >
          {text}
        </pre>
      )}
    </div>
  )
}
