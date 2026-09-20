import { motion } from "framer-motion"
import { useViewerControls } from "../controls"
import type { DocumentSource } from "../types"

export function ImageRenderer({
  source,
  url,
}: {
  source: DocumentSource
  url: string
}) {
  const { zoom, rotate } = useViewerControls()
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden p-4">
      <motion.img
        src={url}
        alt={source.name}
        drag={zoom > 1}
        dragMomentum={false}
        draggable={false}
        style={{ scale: zoom, rotate }}
        className="max-h-full max-w-full origin-center cursor-grab object-contain select-none active:cursor-grabbing"
      />
    </div>
  )
}
