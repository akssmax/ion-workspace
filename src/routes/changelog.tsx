import { createFileRoute } from "@tanstack/react-router"
import { ChangelogPage } from "@/components/marketing/changelog-page"

export const Route = createFileRoute("/changelog")({
  component: ChangelogPage,
  head: () => ({
    meta: [
      { title: "Changelog — What we shipped at Ion" },
      {
        name: "description",
        content:
          "Reverse-chronological, dated changelog of everything that ships in the Ion workspace.",
      },
    ],
  }),
})
