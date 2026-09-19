import { useEffect } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { AppShell } from "@/components/shell/app-shell"
import { useSession } from "@/hooks/use-session"

export const Route = createFileRoute("/app")({
  component: AppRoute,
})

function AppRoute() {
  const { data: session, isLoading } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !session) void navigate({ to: "/login", replace: true })
  }, [isLoading, session, navigate])

  if (isLoading || !session) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }
  return <AppShell />
}
