/**
 * App-wide error boundary pattern.
 *
 * - `ErrorBoundary`: React class boundary that catches render errors in its
 *   subtree and swaps in `ErrorFallback` instead of white-screening.
 * - `ErrorFallback`: shows the error details, the relevant code frames,
 *   and recovery actions (try again / reload / copy details).
 * - `RouteErrorFallback`: adapter for TanStack Router's `errorComponent`.
 */

import { Component, useMemo, useState, type ErrorInfo, type ReactNode } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  summarizeError,
  toErrorReportText,
  type ErrorSummary,
} from "@/lib/errors"

interface ErrorBoundaryProps {
  /** Label shown in the fallback title, e.g. "Calendar". */
  name?: string
  children: ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  error: Error | null
  componentStack: string | null
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null, componentStack: null }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[ErrorBoundary${this.props.name ? `:${this.props.name}` : ""}]`,
      error,
      info.componentStack
    )
    this.setState({ componentStack: info.componentStack ?? null })
  }

  private handleReset = () => {
    this.props.onReset?.()
    this.setState({ error: null, componentStack: null })
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          componentStack={this.state.componentStack}
          reset={this.handleReset}
          name={this.props.name}
        />
      )
    }
    return this.props.children
  }
}

export function ErrorFallback({
  error,
  componentStack,
  reset,
  name,
}: {
  error: unknown
  componentStack?: string | null
  reset?: () => void
  name?: string
}) {
  const summary: ErrorSummary = useMemo(() => summarizeError(error), [error])
  const [copied, setCopied] = useState(false)
  const route =
    typeof window !== "undefined" ? window.location.pathname : undefined

  async function copyDetails() {
    const text = toErrorReportText(summary, {
      route,
      boundary: name,
    })
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard API unavailable (permissions / insecure context): fall
      // back to the legacy execCommand path.
      const area = document.createElement("textarea")
      area.value = text
      document.body.appendChild(area)
      area.select()
      document.execCommand("copy")
      area.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center gap-4 overflow-y-auto p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <AlertCircle className="size-6" />
      </div>
      <div className="max-w-lg space-y-1">
        <h2 className="text-lg font-semibold">
          Something went wrong{name ? ` in ${name}` : ""}
        </h2>
        <p className="rounded-lg bg-muted px-3 py-2 font-mono text-xs break-all">
          {summary.name}: {summary.message}
        </p>
      </div>

      {summary.relevantFrames.length > 0 ? (
        <details className="w-full max-w-lg rounded-xl border bg-card p-3 text-left">
          <summary className="cursor-pointer text-sm font-medium">
            Relevant code ({summary.relevantFrames.length} frame
            {summary.relevantFrames.length > 1 ? "s" : ""})
          </summary>
          <ol className="mt-2 space-y-1 font-mono text-xs break-all">
            {summary.relevantFrames.map((frame, i) => (
              <li key={i} className="text-muted-foreground">
                <span className="text-foreground">at {frame}</span>
              </li>
            ))}
          </ol>
        </details>
      ) : null}

      {componentStack ? (
        <details className="w-full max-w-lg rounded-xl border bg-card p-3 text-left">
          <summary className="cursor-pointer text-sm font-medium">
            React component stack
          </summary>
          <pre className="mt-2 overflow-x-auto font-mono text-xs whitespace-pre-wrap text-muted-foreground">
            {componentStack}
          </pre>
        </details>
      ) : null}

      {summary.fullStack ? (
        <details className="w-full max-w-lg rounded-xl border bg-card p-3 text-left">
          <summary className="cursor-pointer text-sm font-medium">
            Full stack trace
          </summary>
          <pre className="mt-2 overflow-x-auto font-mono text-xs whitespace-pre-wrap text-muted-foreground">
            {summary.fullStack}
          </pre>
        </details>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-2">
        {reset ? (
          <Button size="sm" onClick={reset}>
            Try again
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Reload page
        </Button>
        <Button variant="ghost" size="sm" onClick={() => void copyDetails()}>
          {copied ? "Copied!" : "Copy details"}
        </Button>
      </div>
    </div>
  )
}

/** Adapter for TanStack Router route `errorComponent`s. */
export function RouteErrorFallback({
  error,
  reset,
}: {
  error: unknown
  reset: () => void
}) {
  return <ErrorFallback error={error} reset={reset} />
}
