import { createFileRoute } from "@tanstack/react-router"
import { MigrationPage } from "@/components/marketing/migration-page"

export const Route = createFileRoute("/migration")({
  component: MigrationPage,
  head: () => ({
    meta: [
      { title: "Migration — Moving to Ion" },
      {
        name: "description",
        content:
          "Moving from Google Workspace or Zoho? How Ion migrates mail, contacts, calendars, and files — cutover process, timeline, and the IT checklist.",
      },
    ],
  }),
})
