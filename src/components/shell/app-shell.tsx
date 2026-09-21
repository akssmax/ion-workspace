/**
 * Shell layout: sidebar + active app view + command palette + shortcuts.
 */

import type { CSSProperties } from "react"
import "@/features/catalog"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SidebarShell } from "./sidebar"
import { MobileAppNav } from "./mobile-app-nav"
import { CommandPalette } from "./command-palette"
import { KeyboardShortcuts } from "./keyboard-shortcuts"
import { useJmapPush } from "@/queries/push"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { MailView } from "../mail/mail-view"
import { CalendarView } from "../calendar/calendar-view"
import { ContactsView } from "../contacts/contacts-view"
import { FilesView } from "../files/files-view"
import { ComposeDock } from "../mail/composer"
import { SendStatusPill } from "../mail/send-status"
import { Toaster } from "@/components/ui/sonner"
import { NotificationsBridge } from "@/modules/system/notifications"

export function AppShell() {
  const app = useWorkspaceStore((s) => s.app)
  useJmapPush()

  return (
    <SidebarProvider
      defaultOpen
      className="h-svh overflow-hidden"
      style={{ "--sidebar-width": "300px" } as CSSProperties}
    >
      <SidebarShell />
      <SidebarInset className="h-svh overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
          {app === "mail" ? <MailView /> : null}
          {app === "calendar" ? <CalendarView /> : null}
          {app === "contacts" ? <ContactsView /> : null}
          {app === "files" ? <FilesView /> : null}
        </div>
      </SidebarInset>
      <MobileAppNav />
      <CommandPalette />
      <ComposeDock />
      <SendStatusPill />
      <Toaster position="bottom-left" />
      <NotificationsBridge />
      <KeyboardShortcuts />
    </SidebarProvider>
  )
}
