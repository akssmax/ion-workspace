/**
 * "New folder" row for the mailbox panel — inline creation with validation
 * errors surfaced from Mailbox/set.
 */

import { useRef, useState } from "react"
import { FolderPlus } from "lucide-react"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { useCreateMailbox } from "@/queries/mail"
import { usePreferences, useSavePreferences } from "@/queries/preferences"
import { useLanguage } from "@/lib/language"
import type { TagAppearance } from "@/lib/tag-appearance"
import { TagAppearanceDraftControl } from "@/modules/mail/labels"

export function NewFolderRow() {
  const { t } = useLanguage()
  const { data: prefs } = usePreferences()
  const save = useSavePreferences()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")
  const [draft, setDraft] = useState<TagAppearance>({})
  const [error, setError] = useState<string | null>(null)
  const appearanceOpen = useRef(false)
  const create = useCreateMailbox()

  async function commit() {
    const trimmed = name.trim()
    if (!trimmed) {
      cancel()
      return
    }
    try {
      const result = await create.mutateAsync(trimmed)
      const newId = result.created?.new.id
      if (newId && (draft.color || draft.icon)) {
        await save.mutateAsync({
          tagAppearance: { ...prefs?.tagAppearance, [newId]: draft },
        })
      }
      cancel()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create folder.")
    }
  }

  function cancel() {
    setEditing(false)
    setName("")
    setDraft({})
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
          <span>{t("New folder")}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <div className="space-y-1 px-2 py-1">
        <div
          className="flex items-center gap-1"
          onBlur={(event) => {
            if (appearanceOpen.current) return
            if (event.currentTarget.contains(event.relatedTarget)) return
            void commit()
          }}
        >
          <Input
            autoFocus
            value={name}
            placeholder={t("Folder name")}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void commit()
              if (e.key === "Escape") cancel()
            }}
            className="h-6 px-1 text-sm"
            aria-label={t("New folder name")}
          />
          <TagAppearanceDraftControl
            name={name}
            color={draft.color}
            icon={draft.icon}
            onChange={setDraft}
            onOpenChange={(open) => {
              appearanceOpen.current = open
            }}
          />
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    </SidebarMenuItem>
  )
}
