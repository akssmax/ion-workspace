import { createFileRoute } from "@tanstack/react-router"
import { ProductPage } from "@/components/marketing/product-page"

export const Route = createFileRoute("/product")({
  component: ProductPage,
  head: () => ({
    meta: [
      { title: "The Ion workspace — Mail, calendar, contacts, and files" },
      {
        name: "description",
        content:
          "Explore the four essentials of your business day in Ion, with familiar workflows and an open foundation.",
      },
    ],
  }),
})
