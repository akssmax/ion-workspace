/**
 * Error-reporting helpers for the app's error boundaries.
 *
 * Pure functions (unit-tested) that turn an unknown thrown value into
 * display-ready details, including the *relevant code* frames: the stack
 * frames pointing at app source, with bundler and framework noise removed.
 */

export interface ErrorSummary {
  name: string
  message: string
  /** App-source stack frames, most relevant first (max 8). */
  relevantFrames: string[]
  fullStack?: string
}

const MAX_RELEVANT_FRAMES = 8

/** True for stack lines that point at app source (not framework noise). */
function isAppFrame(line: string): boolean {
  if (!line.includes("at ")) return false
  if (line.includes("node_modules")) return false
  if (/__vite|vite\/dist|react-dom|scheduler|tanstack|zustand|date-fns/.test(line))
    return false
  return /(\bsrc[\\/]|[\\/]src[\\/]|\.tsx?:|\.jsx?:)/.test(line)
}

function cleanFrame(line: string): string {
  return line
    .trim()
    .replace(/^at\s+/, "")
    .replace(/\?v=[\da-f]+/g, "")
    .slice(0, 220)
}

function messageOf(error: unknown): string {
  if (typeof error === "string") return error
  try {
    const json = JSON.stringify(error)
    if (typeof json === "string" && json !== "{}") return json
  } catch {
    // fall through to String()
  }
  return String(error)
}

export function summarizeError(error: unknown): ErrorSummary {
  if (error instanceof Error) {
    const lines = (error.stack ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
    const frames = lines.filter((line) => line.startsWith("at "))
    const relevant = frames
      .filter(isAppFrame)
      .map(cleanFrame)
      .slice(0, MAX_RELEVANT_FRAMES)
    // If no app frame survived filtering, show the top raw frames so the
    // fallback still points at *some* relevant code.
    const fallback =
      relevant.length === 0 ? frames.slice(0, 3).map(cleanFrame) : []
    return {
      name: error.name || "Error",
      message: error.message || messageOf(error),
      relevantFrames: relevant.length > 0 ? relevant : fallback,
      fullStack: error.stack,
    }
  }
  return { name: "Error", message: messageOf(error), relevantFrames: [] }
}

/** Plain-text report for the "copy details" action. */
export function toErrorReportText(
  summary: ErrorSummary,
  context?: { route?: string; boundary?: string }
): string {
  const lines = [
    `Error: ${summary.name}: ${summary.message}`,
    `When: ${new Date().toISOString()}`,
  ]
  if (context?.boundary) lines.push(`Boundary: ${context.boundary}`)
  if (context?.route) lines.push(`Route: ${context.route}`)
  if (summary.relevantFrames.length > 0) {
    lines.push("", "Relevant code:")
    for (const frame of summary.relevantFrames) lines.push(`  at ${frame}`)
  }
  if (summary.fullStack) {
    lines.push("", "Stack trace:", summary.fullStack)
  }
  return lines.join("\n")
}
