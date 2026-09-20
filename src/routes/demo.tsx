import { createFileRoute, useHydrated } from "@tanstack/react-router"
import { lazy, Suspense, useState, useEffect } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { createWorkspaceQueryClient } from "@/queries/client"
import { isDemoSurface } from "@/lib/demo/preview-messages"
import { isDemoRuntime } from "@/lib/demo/runtime"
import { Spinner } from "@/components/ui/spinner"
import "@/components/marketing/demo.css"

const DemoApp = lazy(() =>
  import("@/components/marketing/demo-workspace").then((m) => ({
    default: m.DemoWorkspace,
  }))
)
export const Route = createFileRoute("/demo")({
  validateSearch: (search: Record<string, unknown>) => ({
    embed: search.embed === true || search.embed === "true",
    surface: isDemoSurface(search.surface) ? search.surface : ("mail" as const),
    theme: search.theme === "dark" ? ("dark" as const) : ("light" as const),
  }),
  component: DemoRoute,
  head: () => ({
    meta: [
      { title: "Try Ion — Interactive sample workspace" },
      {
        name: "description",
        content:
          "Explore Ion’s mail, calendar, contacts, and files with sample data. No account needed. Messages are simulated.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
})
function DemoRoute() {
  const { embed, surface, theme } = Route.useSearch()
  const hydrated = useHydrated()
  const [client] = useState(createWorkspaceQueryClient)
  useEffect(() => {
    if (hydrated && !isDemoRuntime) window.location.reload()
  }, [hydrated])
  // Also enforce the boundary for any future client-side Link into this route.
  if (hydrated && !isDemoRuntime) {
    return <Loading />
  }
  return (
    <div className={embed ? "ion-demo ion-demo-embedded" : "ion-demo"}>
      {!embed && (
        <header className="ion-demo-bar">
          <div>
            <strong>Demo workspace · Sample data</strong>
            <span>Changes reset on refresh. Messages are not delivered.</span>
          </div>
          <nav aria-label="Demo actions">
            <button onClick={() => window.location.reload()}>Reset demo</button>
            <a href="/">Exit demo</a>
            <a className="ion-demo-cta" href="/request-access">
              Request pilot access ↗
            </a>
          </nav>
        </header>
      )}
      <div className="ion-demo-workspace">
        {hydrated ? (
          <QueryClientProvider client={client}>
            <Suspense fallback={<Loading />}>
              <DemoApp
                embedded={embed}
                initialSurface={surface}
                initialTheme={theme}
              />
            </Suspense>
          </QueryClientProvider>
        ) : (
          <Loading />
        )}
      </div>
    </div>
  )
}
function Loading() {
  return (
    <div
      className="flex h-full items-center justify-center gap-2 p-12 text-sm text-muted-foreground"
      role="status"
    >
      <Spinner />
      <span>Opening your sample workspace…</span>
    </div>
  )
}
