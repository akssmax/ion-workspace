import { useEffect } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  SettingsPage,
  isSettingsSectionId,
} from "@/components/settings/settings-page"
import { Spinner } from "@/components/ui/spinner"
import { useSession } from "@/hooks/use-session"

export const Route = createFileRoute("/settings")({
  validateSearch: (search: Record<string, unknown>): { section: string } => {
    return {
      section: isSettingsSectionId(search.section) ? search.section : "general",
    }
  },
  component: SettingsRoute,
})

function SettingsRoute() {
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

  return <SettingsPage />
}
