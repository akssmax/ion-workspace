/**
 * Toast helpers for mail actions.
 *
 * `runWithUndo` shows a loading toast while a mutation runs, then resolves it
 * to a success toast with an optional Undo action — or an error toast if the
 * mutation fails.
 */

import { toast } from "sonner"
import type { ReactNode } from "react"

export interface RunWithUndoOptions {
  /** Message shown while the action is in flight. */
  loading: string
  /** Message shown on success. */
  success: ReactNode
  /** Message shown on failure (the thrown message is preferred when present). */
  error: string
  /** Label for the undo button. Defaults to "Undo". */
  undoLabel?: string
  /** Inverse mutation run when the user clicks Undo. */
  onUndo?: () => Promise<unknown> | unknown
  /** Message shown if the undo itself fails. */
  undoError?: string
  /** How long the success/undo toast stays visible, in ms. */
  duration?: number
}

/** Run `promise` and surface its outcome as a toast, optionally with Undo. */
export function runWithUndo(
  promise: Promise<unknown>,
  {
    loading,
    success,
    error,
    undoLabel = "Undo",
    onUndo,
    undoError = "Couldn't undo that action.",
    duration = 7000,
  }: RunWithUndoOptions
): void {
  const id = toast.loading(loading)
  void promise.then(
    () => {
      toast.success(success, {
        id,
        duration,
        action: onUndo
          ? {
              label: undoLabel,
              onClick: () => {
                void Promise.resolve(onUndo()).catch((undoFailure) => {
                  toast.error(errorMessage(undoFailure, undoError))
                })
              },
            }
          : undefined,
      })
    },
    (failure) => toast.error(errorMessage(failure, error), { id })
  )
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}
