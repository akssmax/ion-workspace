import { useEffect } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { AppShell } from "@/components/shell/app-shell"
import { Spinner } from "@/components/ui/spinner"
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
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }
  return <AppShell />
}
