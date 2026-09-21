import { createFileRoute } from "@tanstack/react-router"
import { SecurityPage } from "@/components/marketing/security-page"

export const Route = createFileRoute("/security")({
  component: SecurityPage,
  head: () => ({
    meta: [
      { title: "Security & trust — Ion" },
      {
        name: "description",
        content:
          "How Ion handles encryption, hosting, backups, and compliance — with an honest statement of what is done today and what is in progress.",
      },
    ],
  }),
})
