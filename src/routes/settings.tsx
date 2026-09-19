import { useEffect } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  SettingsPage,
  SETTINGS_SECTION_IDS,
} from "@/components/settings/settings-page"
import type { SettingsSectionId } from "@/components/settings/settings-page"
import { useSession } from "@/hooks/use-session"

export const Route = createFileRoute("/settings")({
  validateSearch: (search: Record<string, unknown>): { section: SettingsSectionId } => {
    const section = search.section as SettingsSectionId
    return {
      section: SETTINGS_SECTION_IDS.includes(section) ? section : "general",
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
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  return <SettingsPage />
}
