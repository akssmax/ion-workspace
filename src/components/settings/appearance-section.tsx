import { ThemeController } from "@/components/theme/theme-controller"

export function AppearanceSection() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        These settings live on this device and apply across the app, docs, and
        login. White-label brands can ship a different default config without
        changing components.
      </p>
      <ThemeController />
    </div>
  )
}
