/**
 * Controls shared between the viewer chrome and the active renderer.
 */

import { createContext, useContext } from "react"
import type { ViewerControls } from "./types"

export const ViewerControlsContext = createContext<ViewerControls | null>(null)

export function useViewerControls(): ViewerControls {
  const controls = useContext(ViewerControlsContext)
  if (!controls) {
    throw new Error("useViewerControls must be used within DocumentViewer.")
  }
  return controls
}
