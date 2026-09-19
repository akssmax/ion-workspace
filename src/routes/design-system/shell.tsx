import { createFileRoute } from "@tanstack/react-router"
import {
  Archive,
  Inbox,
  Mail,
  Star,
  Send,
  FileText,
  Users,
  CalendarDays,
  ChevronsUpDown,
} from "lucide-react"
import { DocsFile, DocsPage, DocsSection } from "@/components/design-system/page"
import { Playground } from "@/components/design-system/playground"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"

export const Route = createFileRoute("/design-system/shell")({
  component: ShellPage,
  head: () => ({
    meta: [{ title: "Shell · Design System" }],
  }),
})

function ShellPage() {
  return (
    <DocsPage
      title="Shell"
      description="The authenticated chrome: nested sidebar (icon rail + contextual panel), command palette, and user menu. Product files live outside these playgrounds and talk to Zustand + JMAP."
    >
      <DocsSection
        title="Pieces"
        description="Source of the live chrome."
      >
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <DocsFile path="src/components/shell/app-shell.tsx" /> — view switch
          </li>
          <li>
            <DocsFile path="src/components/shell/sidebar.tsx" /> — icon rail + panels
          </li>
          <li>
            <DocsFile path="src/modules/mail/mailboxes/mailbox-row.tsx" /> — folder
            row
          </li>
          <li>
            <DocsFile path="src/components/shell/nav-user.tsx" /> — account menu
          </li>
          <li>
            <DocsFile path="src/components/shell/command-palette.tsx" /> — Cmd/Ctrl+K
          </li>
        </ul>
      </DocsSection>
      <DocsSection title="Mailbox panel">
        <Playground
          title="Mailbox rows"
          canvasClassName="w-full p-0"
          render={() => (
            <SidebarProvider className="min-h-0 w-full max-w-xs">
              <Sidebar className="relative w-full" collapsible="none">
                <SidebarHeader className="border-b">
                  <p className="px-2 text-sm font-semibold">Mail</p>
                </SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Folders</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton isActive>
                            <Inbox />
                            Inbox
                          </SidebarMenuButton>
                          <SidebarMenuBadge>4</SidebarMenuBadge>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton>
                            <Star />
                            Starred
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton>
                            <Send />
                            Sent
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton>
                            <Archive />
                            Archive
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton size="lg">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarFallback className="rounded-lg">YO</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">You</span>
                          <span className="truncate text-xs">
                            demo@workspace.local
                          </span>
                        </div>
                        <ChevronsUpDown className="ml-auto size-4" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarFooter>
              </Sidebar>
            </SidebarProvider>
          )}
          code={() =>
            `<SidebarMenuButton isActive>\n  <Inbox /> Inbox\n</SidebarMenuButton>`
          }
        />
      </DocsSection>
      <DocsSection title="App switcher">
        <Playground
          title="Icon rail"
          render={() => (
            <div className="flex flex-col gap-1 rounded-2xl border bg-sidebar p-2">
              {[
                { icon: Mail, label: "Mail", active: true },
                { icon: CalendarDays, label: "Calendar" },
                { icon: Users, label: "Contacts" },
                { icon: FileText, label: "Files" },
              ].map((app) => (
                <button
                  key={app.label}
                  aria-label={app.label}
                  className={
                    app.active
                      ? "flex size-9 items-center justify-center rounded-xl bg-sidebar-accent text-sidebar-accent-foreground"
                      : "flex size-9 items-center justify-center rounded-xl text-sidebar-foreground hover:bg-sidebar-accent"
                  }
                >
                  <app.icon className="size-4" />
                </button>
              ))}
            </div>
          )}
          code={() =>
            `<button aria-label="Mail" className="size-9 rounded-xl bg-sidebar-accent">\n  <Mail className="size-4" />\n</button>`
          }
        />
      </DocsSection>
      <DocsSection title="Command palette">
        <Playground
          title="Cmd+K chrome"
          canvasClassName="w-full"
          render={() => (
            <Command className="max-w-md rounded-2xl border shadow-sm">
              <CommandInput placeholder="Search commands…" />
              <CommandList>
                <CommandEmpty>No results.</CommandEmpty>
                <CommandGroup heading="Actions">
                  <CommandItem>Compose</CommandItem>
                  <CommandItem>Go to Inbox</CommandItem>
                </CommandGroup>
                <CommandGroup heading="Apps">
                  <CommandItem>Mail</CommandItem>
                  <CommandItem>Calendar</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          )}
          code={() =>
            `<Command>\n  <CommandInput placeholder="Search commands…" />\n  <CommandList>…</CommandList>\n</Command>`
          }
        />
      </DocsSection>
    </DocsPage>
  )
}
