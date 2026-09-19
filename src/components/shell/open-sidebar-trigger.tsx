import { SidebarTrigger } from "@/components/ui/sidebar"

/**
 * Reopen control for the mailbox/nav panel. Hidden while the panel is
 * expanded (the trigger already lives in that panel). Shown in the app
 * header once the sidebar collapses to the icon rail — see SidebarInset.
 */
export function OpenSidebarTrigger() {
  return <SidebarTrigger data-slot="open-sidebar-trigger" />
}
