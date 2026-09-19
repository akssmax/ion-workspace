import { createFileRoute } from "@tanstack/react-router"
import { RoadmapPage } from "@/components/marketing/roadmap-page"

export const Route = createFileRoute("/roadmap")({
  component: RoadmapPage,
  head: () => ({
    meta: [
      { title: "Roadmap — What we’re building at Ion" },
      {
        name: "description",
        content:
          "Explore what is available, in progress, planned, and being explored for the Ion workspace.",
      },
    ],
  }),
})
