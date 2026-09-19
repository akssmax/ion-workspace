import { createFileRoute } from "@tanstack/react-router"
import { AccessPage } from "@/components/marketing/access-page"

export const Route = createFileRoute("/request-access")({
  validateSearch: (
    search: Record<string, unknown>
  ): { source: "enterprise" | "website" } => ({
    source: search.source === "enterprise" ? "enterprise" : "website",
  }),
  component: RequestAccessRoute,
  head: () => ({
    meta: [
      { title: "Request Ion pilot access — Your business, your next step" },
      {
        name: "description",
        content:
          "Tell us about your business and request access to Ion’s managed private pilot.",
      },
    ],
  }),
})
function RequestAccessRoute() {
  const { source } = Route.useSearch()
  return <AccessPage source={source} />
}
