/**
 * Mobile app switcher. On phones the sidebar collapses into a sheet, so this
 * MD3 bottom navigation bar is the primary way to move between Mail, Calendar,
 * Contacts and Files. Hidden on md+ where the icon rail is always visible.
 */

import { cn } from "cn"
import { useComposerStore } from "@/stores/composer.store"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useLanguage } from "@/lib/language"
import type { TranslationKey } from "@/lib/language"
import { APPS } from "./apps"

export function MobileAppNav() {
  const app = useWorkspaceStore((s) => s.app)
  const setApp = useWorkspaceStore((s) => s.setApp)
  const composerOpen = useComposerStore((s) => s.open)
  const composerMode = useComposerStore((s) => s.mode)
  const { t } = useLanguage()

  // The docked composer covers the bottom of the screen; get out of its way.
  if (composerOpen && (composerMode === "new" || composerMode === "draft"))
    return null

  return (
    <nav
      aria-label="Apps"
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around gap-1 border-t bg-background/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
    >
      {APPS.map((item) => {
        const active = app === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setApp(item.id)}
            aria-current={active ? "page" : undefined}
            className="group flex min-w-0 flex-1 flex-col items-center justify-start gap-1 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <span
              className={cn(
                "flex h-8 w-16 items-center justify-center rounded-full transition-colors",
                active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground group-hover:bg-muted/60 group-hover:text-foreground"
              )}
            >
              <item.icon className="size-6" />
            </span>
            <span
              className={cn(
                "w-full truncate text-center text-xs transition-colors",
                active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            >
              {t(item.label as TranslationKey)}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
