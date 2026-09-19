import { createFileRoute } from "@tanstack/react-router"
import { EnterprisePage } from "@/components/marketing/enterprise-page"

export const Route = createFileRoute("/enterprise")({
  component: EnterprisePage,
  head: () => ({
    meta: [
      { title: "Ion for organizations — Enterprise evaluation" },
      {
        name: "description",
        content:
          "Review Ion’s current workspace capabilities, architecture, and managed private-pilot evaluation process for your organization.",
      },
    ],
  }),
})
