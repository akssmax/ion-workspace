/**
 * Mobile top-app-bar settings entry. Desktop keeps the Settings item in the
 * sidebar icon rail; on phones the rail is hidden behind a sheet, so each app
 * header exposes a gear button instead.
 */

import { Settings } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { cn } from "cn"
import { isDemoRuntime } from "@/lib/demo/runtime"

export function SettingsButton({ className }: { className?: string }) {
  if (isDemoRuntime) return null
  return (
    <Button
      variant="ghost"
      size="icon-touch"
      aria-label="Settings"
      render={<Link to="/settings" search={{ section: "general" }} />}
      className={cn("md:hidden", className)}
    >
      <Settings className="size-4" />
    </Button>
  )
}
