import { createFileRoute } from "@tanstack/react-router"
import { IntegrationsPage } from "@/components/marketing/integrations-page"

export const Route = createFileRoute("/integrations")({
  component: IntegrationsPage,
  head: () => ({
    meta: [
      { title: "Integrations — What Ion connects to" },
      {
        name: "description",
        content:
          "What Ion connects to today, and what is coming: SSO/SAML, two-way calendar sync, Slack, CRM. Request the integration your team needs first.",
      },
    ],
  }),
})
