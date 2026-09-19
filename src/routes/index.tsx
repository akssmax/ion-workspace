import { createFileRoute, useHydrated } from "@tanstack/react-router"
import { AppShell } from "@/components/shell/app-shell"
import { LandingPage } from "@/components/landing/landing-page"
import { useSession } from "@/hooks/use-session"

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Ion — Four apps. One protocol." },
      {
        name: "description",
        content:
          "Ion is a JMAP-native workspace for mail, calendar, contacts, and files.",
      },
    ],
  }),
})

function HomePage() {
  const hydrated = useHydrated()
  const { data: session } = useSession()

  // SSR and the first client render must match. Session is only known after
  // hydrate (and after the session query), so keep the landing tree until then.
  if (hydrated && session) {
    return <AppShell />
  }

  return <LandingPage />
}
