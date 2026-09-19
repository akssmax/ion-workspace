/**
 * "New folder" row for the mailbox panel — inline creation with validation
 * errors surfaced from Mailbox/set.
 */

import { useState } from "react"
import { FolderPlus } from "lucide-react"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { useCreateMailbox } from "@/queries/mail"

export function NewFolderRow() {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const create = useCreateMailbox()

  async function commit() {
    const trimmed = name.trim()
    if (!trimmed) {
      cancel()
      return
    }
    try {
      await create.mutateAsync(trimmed)
      cancel()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create folder.")
    }
  }

  function cancel() {
    setEditing(false)
    setName("")
    setError(null)
  }

  if (!editing) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setEditing(true)}
          className="text-muted-foreground"
        >
          <FolderPlus className="size-4" />
          <span>New folder</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <div className="space-y-1 px-2 py-1">
        <Input
          autoFocus
          value={name}
          placeholder="Folder name"
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          onBlur={() => void commit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") void commit()
            if (e.key === "Escape") cancel()
          }}
          className="h-6 px-1 text-sm"
          aria-label="New folder name"
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    </SidebarMenuItem>
  )
}
