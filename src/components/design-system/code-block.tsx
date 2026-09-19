import { useEffect, useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { useDocsTheme } from "./theme"

export function CodeBlock({
  code,
  lang = "tsx",
  className,
}: {
  code: string
  lang?: string
  className?: string
}) {
  const { dark } = useDocsTheme()
  const [html, setHtml] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    void import("shiki/bundle/web").then(({ codeToHtml }) =>
      codeToHtml(code, {
        lang: lang === "tsx" ? "tsx" : lang,
        theme: dark ? "github-dark" : "github-light",
      }).then((result) => {
        if (!cancelled) setHtml(result)
      })
    )
    return () => {
      cancelled = true
    }
  }, [code, lang, dark])

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-muted/40",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon-xs"
        className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={() => void copy()}
        aria-label="Copy code"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </Button>
      {html ? (
        <div
          className="overflow-x-auto p-4 text-[13px] leading-relaxed [&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:p-0 [&_code]:font-mono"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}
