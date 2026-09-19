import { isDemoRuntime } from "@/lib/demo/runtime"
/**
 * Command palette (Cmd/Ctrl+K): fast navigation and actions.
 */

import { useEffect, useState } from "react"
import {
  CalendarDays,
  Mail,
  Users,
  FileText,
  Plus,
  Inbox,
  Star,
  Send,
  FileEdit,
  Archive,
  Trash2,
  Settings,
  Palette,
} from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useWorkspaceStore } from "@/stores/workspace.store"
import type { WorkspaceApp } from "@/stores/workspace.store"
import { useMailStore } from "@/stores/mail.store"
import { useComposerStore } from "@/stores/composer.store"
import { useCalendarStore } from "@/stores/calendar.store"
import { useMailboxes, sortMailboxes } from "@/queries/mail"

export function CommandPalette() {
  const open = useWorkspaceStore((s) => s.paletteOpen)
  const setOpen = useWorkspaceStore((s) => s.setPaletteOpen)
  const setApp = useWorkspaceStore((s) => s.setApp)
  const setActiveMailbox = useMailStore((s) => s.setActiveMailbox)
  const setSearchQuery = useMailStore((s) => s.setSearchQuery)
  const openCompose = useComposerStore((s) => s.openCompose)
  const goToday = useCalendarStore((s) => s.goToday)
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const { data: rawMailboxes } = useMailboxes()
  const mailboxes = sortMailboxes(rawMailboxes ?? [])

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const FOLDER_LABELS: Record<string, string> = {
    inbox: "Inbox",
    starred: "Starred",
    sent: "Sent",
    drafts: "Drafts",
    archive: "Archive",
    trash: "Trash",
  }

  const FOLDER_ICONS: Record<string, React.ReactNode> = {
    inbox: <Inbox className="size-4" />,
    starred: <Star className="size-4" />,
    sent: <Send className="size-4" />,
    drafts: <FileEdit className="size-4" />,
    archive: <Archive className="size-4" />,
    trash: <Trash2 className="size-4" />,
  }

  function goApp(app: WorkspaceApp) {
    setApp(app)
    setOpen(false)
  }

  function goMailbox(id: string) {
    setSearchQuery("")
    setActiveMailbox(id)
    setApp("mail")
    setOpen(false)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Palette"
      description="Jump to anything"
    >
      <Command>
        <CommandInput
          placeholder="Type a command or search…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Create">
            <CommandItem
              value="compose new email"
              onSelect={() => {
                openCompose({ open: true, mode: "new" })
                setOpen(false)
              }}
            >
              <Plus className="size-4" />
              Compose new email
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Apps">
            <CommandItem value="go to mail" onSelect={() => goApp("mail")}>
              <Mail className="size-4" />
              Open Mail
            </CommandItem>
            <CommandItem
              value="go to calendar"
              onSelect={() => goApp("calendar")}
            >
              <CalendarDays className="size-4" />
              Open Calendar
            </CommandItem>
            <CommandItem
              value="go to contacts"
              onSelect={() => goApp("contacts")}
            >
              <Users className="size-4" />
              Open Contacts
            </CommandItem>
            <CommandItem value="go to files" onSelect={() => goApp("files")}>
              <FileText className="size-4" />
              Open Files
            </CommandItem>
            {!isDemoRuntime && <><CommandItem
              value="open settings preferences"
              onSelect={() => {
                setOpen(false)
                void navigate({
                  to: "/settings",
                  search: { section: "general" },
                })
              }}
            >
              <Settings className="size-4" />
              Open Settings
            </CommandItem>
            <CommandItem
              value="open appearance theme colors"
              onSelect={() => {
                setOpen(false)
                void navigate({
                  to: "/settings",
                  search: { section: "appearance" },
                })
              }}
            >
              <Palette className="size-4" />
              Appearance
            </CommandItem></>}
          </CommandGroup>
          <CommandGroup heading="Calendar">
            <CommandItem
              value="go to today"
              onSelect={() => {
                goToday()
                setApp("calendar")
                setOpen(false)
              }}
            >
              <CalendarDays className="size-4" />
              Go to today
            </CommandItem>
          </CommandGroup>
          {mailboxes.length > 0 ? (
            <CommandGroup heading="Mailboxes">
              {mailboxes.map((mb) => (
                <CommandItem
                  key={mb.id}
                  value={`mailbox ${mb.name}`}
                  onSelect={() => goMailbox(mb.id)}
                >
                  {mb.role ? (
                    (FOLDER_ICONS[mb.role] ?? <Inbox className="size-4" />)
                  ) : (
                    <Inbox className="size-4" />
                  )}
                  {mb.role ? (FOLDER_LABELS[mb.role] ?? mb.name) : mb.name}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
