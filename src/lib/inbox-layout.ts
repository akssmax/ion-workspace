/**
 * Inbox layout preferences (Outlook / Gmail inspired).
 *
 * Pure model shared by the client UI and the server preferences store, so
 * both sides agree on the valid values and defaults.
 *
 * - `readingPane: "right"`  — Outlook default: list beside the reading pane.
 * - `readingPane: "bottom"` — Outlook classic: list above, reading below.
 * - `readingPane: "hidden"` — Gmail default: full-width list, messages open
 *   full-screen.
 * - `listDensity`: Gmail-style row density (comfortable / cozy / compact).
 * - `showSnippets`: whether rows show the message preview line.
 */

export type ReadingPanePosition = "right" | "bottom" | "hidden"
export type ListDensity = "comfortable" | "cozy" | "compact"
export type RowStyle = "minimal" | "gmail" | "outlook"

export interface InboxLayoutPrefs {
  readingPane: ReadingPanePosition
  listDensity: ListDensity
  showSnippets: boolean
  rowStyle: RowStyle
}

export const DEFAULT_INBOX_LAYOUT: InboxLayoutPrefs = {
  readingPane: "right",
  listDensity: "comfortable",
  showSnippets: true,
  rowStyle: "minimal",
}

const READING_PANES: readonly string[] = ["right", "bottom", "hidden"]
const DENSITIES: readonly string[] = ["comfortable", "cozy", "compact"]
const ROW_STYLES: readonly string[] = ["minimal", "gmail", "outlook"]

export function isReadingPanePosition(
  value: unknown
): value is ReadingPanePosition {
  return typeof value === "string" && READING_PANES.includes(value)
}

export function isListDensity(value: unknown): value is ListDensity {
  return typeof value === "string" && DENSITIES.includes(value)
}

export function isRowStyle(value: unknown): value is RowStyle {
  return typeof value === "string" && ROW_STYLES.includes(value)
}

/**
 * Merge partial/stored prefs over the defaults. Unknown or mistyped values
 * fall back to the default instead of breaking the layout.
 */
export function resolveInboxLayout(
  raw?: {
    readingPane?: unknown
    listDensity?: unknown
    showSnippets?: unknown
    rowStyle?: unknown
  } | null
): InboxLayoutPrefs {
  return {
    readingPane: isReadingPanePosition(raw?.readingPane)
      ? raw.readingPane
      : DEFAULT_INBOX_LAYOUT.readingPane,
    listDensity: isListDensity(raw?.listDensity)
      ? raw.listDensity
      : DEFAULT_INBOX_LAYOUT.listDensity,
    showSnippets:
      typeof raw?.showSnippets === "boolean"
        ? raw.showSnippets
        : DEFAULT_INBOX_LAYOUT.showSnippets,
    rowStyle: isRowStyle(raw?.rowStyle)
      ? raw.rowStyle
      : DEFAULT_INBOX_LAYOUT.rowStyle,
  }
}
