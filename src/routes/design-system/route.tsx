import { createFileRoute } from "@tanstack/react-router"
import { DesignSystemLayout } from "@/components/design-system/layout"

export const Route = createFileRoute("/design-system")({
  component: DesignSystemLayout,
  head: () => ({
    meta: [{ title: "Design System · Workspace" }],
  }),
})
