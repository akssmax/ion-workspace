import { createFileRoute } from "@tanstack/react-router"
import { PricingPage } from "@/components/marketing/pricing-page"

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — Ion" },
      {
        name: "description",
        content:
          "Ion pricing is part of the pilot conversation. Directional Starter, Business, and Enterprise plans, with the whole workspace included in every tier.",
      },
    ],
  }),
})
