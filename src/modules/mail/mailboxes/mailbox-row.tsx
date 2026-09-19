/**
 * Mailbox row with management actions (rename / delete) for custom folders.
 * Role mailboxes (Inbox, Sent, …) render without the action menu.
 */

import { useState } from "react"
import { Folder, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import {
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { Mailbox } from "@/jmap/types/mail"
import { useDeleteMailbox, useRenameMailbox } from "@/queries/mail"

export function MailboxRow({
  mailbox,
  label,
  icon,
  active,
  onPick,
}: {
  mailbox: Mailbox
  label: string
  icon: React.ReactNode
  active: boolean
  onPick: (id: string) => void
}) {
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(mailbox.name)
  const rename = useRenameMailbox()
  const destroy = useDeleteMailbox()
  const manageable = !mailbox.role

  async function commitRename() {
    const trimmed = name.trim()
    setRenaming(false)
    if (!trimmed || trimmed === mailbox.name) {
      setName(mailbox.name)
      return
    }
    try {
      await rename.mutateAsync({ id: mailbox.id, name: trimmed })
    } catch {
      setName(mailbox.name)
    }
  }

  if (renaming) {
    return (
      <SidebarMenuItem>
        <div className="flex items-center gap-2 px-2 py-1">
          {icon}
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => void commitRename()}
            onKeyDown={(e) => {
              if (e.key === "Enter") void commitRename()
              if (e.key === "Escape") {
                setName(mailbox.name)
                setRenaming(false)
              }
            }}
            className="h-6 px-1 text-sm"
            aria-label="Rename folder"
          />
        </div>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={() => onPick(mailbox.id)} isActive={active}>
        {icon}
        <span>{label}</span>
      </SidebarMenuButton>
      {(mailbox.unreadEmails ?? 0) > 0 ? (
        <SidebarMenuBadge>{mailbox.unreadEmails}</SidebarMenuBadge>
      ) : null}
      {manageable ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuAction showOnHover />}
            aria-label={`Manage ${label}`}
          >
            <MoreHorizontal />
            <span className="sr-only">More</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start">
            <DropdownMenuItem
              onClick={() => {
                setName(mailbox.name)
                setRenaming(true)
              }}
            >
              <Pencil className="size-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => void destroy.mutateAsync(mailbox.id)}
            >
              <Trash2 className="size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </SidebarMenuItem>
  )
}

export function defaultMailboxIcon() {
  return <Folder className="size-4" />
}
