import { createFileRoute } from "@tanstack/react-router"
import { ComparePage } from "@/components/marketing/compare-page"

export const Route = createFileRoute("/compare/")({
  component: ComparePage,
  head: () => ({
    meta: [
      { title: "Compare Ion — Google Workspace, Zoho, and more" },
      {
        name: "description",
        content:
          "Honest comparisons of Ion against Google Workspace and Zoho across mail, calendar, contacts, files, protocol, pricing, and migration.",
      },
    ],
  }),
})
