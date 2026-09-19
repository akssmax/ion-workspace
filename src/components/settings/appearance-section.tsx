import { ThemeController } from "@/components/theme/theme-controller"

export function AppearanceSection() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Make this workspace feel like yours. Changes apply instantly across the
        app and are saved on this device.
      </p>
      <ThemeController />
    </div>
  )
}
