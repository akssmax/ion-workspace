/**
 * Inbox settings: reading-pane position, list density and snippet
 * visibility. Migrated from the old settings modal — same instant-save
 * behaviour via useSaveInboxLayout.
 */

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useSaveInboxLayout,
  usePreferences,
  useSavePreferences,
} from "@/queries/preferences"
import { MailLayoutControls } from "@/components/mail/mail-layout-menu"
import { SaveState } from "./setting-row"
import { SettingsGroup } from "./settings-group"

const SWIPE_OPTIONS = [
  { value: "archive", label: "Archive" },
  { value: "trash", label: "Move to trash" },
  { value: "read", label: "Mark read or unread" },
  { value: "star", label: "Star or unstar" },
  { value: "none", label: "No action" },
] as const

export function InboxSection() {
  const save = useSaveInboxLayout()
  const { data: preferences } = usePreferences()
  const savePreferences = useSavePreferences()

  return (
    <div className="space-y-8">
      <SettingsGroup title="Message list">
        <MailLayoutControls />
        <SaveState isSaving={save.isPending} isError={save.isError} />
      </SettingsGroup>

      <SettingsGroup title="Message actions" contentClassName="divide-y">
        <section className="space-y-2 py-4">
          <Label htmlFor="message-actions-position">Message actions</Label>
          <p className="text-xs text-muted-foreground">
            Place archive, spam and reply actions above or below the email.
          </p>
          <Select
            value={preferences?.messageActionsPosition ?? "top"}
            onValueChange={(value) => {
              if (value === "top" || value === "bottom")
                void savePreferences.mutateAsync({
                  messageActionsPosition: value,
                })
            }}
          >
            <SelectTrigger id="message-actions-position" className="w-full">
              <SelectValue>
                {preferences?.messageActionsPosition === "bottom"
                  ? "Below messages"
                  : "Above messages"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Above messages</SelectItem>
              <SelectItem value="bottom">Below messages</SelectItem>
            </SelectContent>
          </Select>
        </section>
        <section className="space-y-3 py-4">
          <div>
            <Label>Mobile swipe actions</Label>
            <p className="text-xs text-muted-foreground">
              Choose what swiping a conversation in either direction does.
            </p>
          </div>
          {(["right", "left"] as const).map((direction) => {
            const key =
              direction === "right" ? "swipeRightAction" : "swipeLeftAction"
            const value = preferences?.[key] ?? "archive"
            return (
              <div
                key={direction}
                className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <Label htmlFor={`swipe-${direction}`}>Swipe {direction}</Label>
                <Select
                  value={value}
                  onValueChange={(next) => {
                    if (SWIPE_OPTIONS.some((option) => option.value === next))
                      void savePreferences.mutateAsync({ [key]: next })
                  }}
                >
                  <SelectTrigger
                    id={`swipe-${direction}`}
                    className="w-full sm:w-56"
                  >
                    <SelectValue>
                      {
                        SWIPE_OPTIONS.find((option) => option.value === value)
                          ?.label
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SWIPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          })}
          <SaveState
            isSaving={savePreferences.isPending}
            isError={savePreferences.isError}
          />
        </section>
      </SettingsGroup>
    </div>
  )
}
