import { useState } from "react"
import { cn } from "cn"

export function ColorSwatch({
  name,
  cssVar,
  className,
  fgClassName,
}: {
  name: string
  cssVar: string
  className: string
  fgClassName?: string
}) {
  const [copied, setCopied] = useState<string | null>(null)

  async function copy(value: string) {
    await navigator.clipboard.writeText(value)
    setCopied(value)
    setTimeout(() => setCopied(null), 1200)
  }

  return (
    <button
      type="button"
      onClick={() => void copy(className.split(" ")[0] ?? cssVar)}
      className="group flex flex-col overflow-hidden rounded-xl border text-left transition-colors hover:border-foreground/20"
    >
      <div className={cn("h-16 w-full", className, fgClassName)} />
      <div className="flex flex-col gap-0.5 px-3 py-2">
        <span className="text-sm font-medium">{name}</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {copied ? "Copied" : cssVar}
        </span>
      </div>
    </button>
  )
}
