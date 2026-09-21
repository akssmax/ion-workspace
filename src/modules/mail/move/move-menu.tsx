/**
 * "Move to" overflow submenu: move the selected threads into another mailbox.
 */

import { FolderInput } from "lucide-react"
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { useMailboxes, useMoveEmails } from "@/queries/mail"
import { useMailStore } from "@/stores/mail.store"

const ROLE_LABELS: Record<string, string> = {
  inbox: "Inbox",
  archive: "Archive",
  sent: "Sent",
  drafts: "Drafts",
  junk: "Spam",
  trash: "Trash",
  flagged: "Flagged",
  important: "Important",
}

export function MoveMenu({
  threadIds,
  disabled,
}: {
  threadIds: string[]
  disabled?: boolean
}) {
  const { data: rawMailboxes } = useMailboxes()
  const activeMailboxId = useMailStore((s) => s.activeMailboxId)
  const move = useMoveEmails()

  const targets = (rawMailboxes ?? []).filter(
    (mb) =>
      mb.id !== activeMailboxId &&
      mb.role !== "flagged" &&
      mb.role !== "important"
  )

  return (
    <DropdownMenuSub disabled={disabled || threadIds.length === 0}>
      <DropdownMenuSubTrigger>
        <FolderInput className="size-4" />
        Move to
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {targets.map((mb) => (
          <DropdownMenuItem
            key={mb.id}
            onClick={() =>
              void move.mutateAsync({
                ids: threadIds,
                toMailboxId: mb.id,
                fromMailboxId: activeMailboxId ?? undefined,
              })
            }
          >
            {mb.role ? (ROLE_LABELS[mb.role] ?? mb.name) : mb.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
