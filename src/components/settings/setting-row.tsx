import type { ReactNode } from "react"

/**
 * Shared settings primitives. Kept out of `settings-page.tsx` so feature
 * modules can reuse them without importing the page (which imports the feature
 * catalog, creating a circular import).
 */

/** Shared labelled row used by several sections. */
export function SettingRow({
  id,
  label,
  hint,
  children,
}: {
  id?: string
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 sm:gap-6">
      <div className="space-y-0.5">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </div>
  )
}

/** Save-state line shared by sections that persist via preferences. */
export function SaveState({
  isSaving,
  isError,
}: {
  isSaving: boolean
  isError: boolean
}) {
  if (isSaving) {
    return <p className="pt-2 text-xs text-muted-foreground">Saving…</p>
  }
  if (isError) {
    return (
      <p className="pt-2 text-xs text-destructive">
        Couldn&apos;t save — please try again.
      </p>
    )
  }
  return null
}
