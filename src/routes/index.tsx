import { useEffect } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { LandingPage } from "@/components/landing/landing-page"

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Ion — Business email. Your working day, together." },
      {
        name: "description",
        content:
          "Email, calendars, contacts, and files in one connected business workspace. Try the Ion demo and request access to our managed private pilot.",
      },
    ],
  }),
})

function HomePage() {
  useEffect(() => {
    const followLegacyAnchor = () => {
      const target = {
        "#shortcuts": "/product#keyboard",
        "#protocol": "/product#protocol",
      }[window.location.hash]
      if (target) window.location.replace(target)
    }
    followLegacyAnchor()
    window.addEventListener("hashchange", followLegacyAnchor)
    return () => window.removeEventListener("hashchange", followLegacyAnchor)
  }, [])
  return <LandingPage />
}
