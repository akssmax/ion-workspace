/**
 * Notifications settings — email/calendar alerts, tone selection and the
 * background-notifications placeholder. Instant-save via the preferences RPC.
 */

import { useEffect, useState } from "react"
import { Bell, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useNotificationPrefs, useSavePreferences } from "@/queries/preferences"
import { NOTIFICATION_SOUNDS, isNotificationSound } from "@/lib/notifications"
import type { NotificationPreferences } from "@/lib/notifications"
import { SettingsGroup } from "@/components/settings/settings-group"
import { SettingRow, SaveState } from "@/components/settings/setting-row"
import { previewNotificationSound } from "./sound"
import {
  notificationPermission,
  requestNotificationPermission,
} from "./notify-core"

export function NotificationsSettings() {
  const prefs = useNotificationPrefs()
  const save = useSavePreferences()
  const [permission, setPermission] = useState(() => notificationPermission())

  // Re-check when the tab regains focus so enabling in browser settings is
  // reflected without a reload.
  useEffect(() => {
    function sync() {
      setPermission(notificationPermission())
    }
    window.addEventListener("focus", sync)
    document.addEventListener("visibilitychange", sync)
    return () => {
      window.removeEventListener("focus", sync)
      document.removeEventListener("visibilitychange", sync)
    }
  }, [])

  function update(patch: Partial<NotificationPreferences>) {
    void save.mutateAsync({ notifications: { ...prefs, ...patch } })
  }

  async function enablePermission() {
    setPermission(await requestNotificationPermission())
  }

  function enableWithPermission(patch: Partial<NotificationPreferences>) {
    update(patch)
    if (permission === "default") void enablePermission()
  }

  const permissionHint =
    permission === "granted"
      ? "Allowed on this device."
      : permission === "denied"
        ? "Blocked. Turn notifications back on for this site in your browser settings."
        : "Allow notifications so alerts can reach this device."

  return (
    <div className="space-y-8">
      <SettingsGroup title="Browser permission">
        <SettingRow label="Notifications" hint={permissionHint}>
          {permission === "granted" ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Bell className="size-4" /> Allowed
            </span>
          ) : permission === "denied" ? (
            <span className="text-sm text-destructive">Blocked</span>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => void enablePermission()}
            >
              Enable notifications
            </Button>
          )}
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Email notifications" contentClassName="divide-y">
        <SettingRow
          label="Email notifications"
          hint="Show alerts when new emails arrive."
        >
          <Switch
            checked={prefs.emailEnabled}
            onCheckedChange={(checked) =>
              checked
                ? enableWithPermission({ emailEnabled: true })
                : update({ emailEnabled: false })
            }
          />
        </SettingRow>
        <SettingRow
          label="Notification sound"
          hint="Play an audio alert when new emails arrive."
        >
          <Switch
            checked={prefs.emailSound}
            onCheckedChange={(checked) => update({ emailSound: checked })}
          />
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Calendar notifications" contentClassName="divide-y">
        <SettingRow
          label="Event notifications"
          hint="Show alerts for upcoming calendar events."
        >
          <Switch
            checked={prefs.calendarEnabled}
            onCheckedChange={(checked) =>
              checked
                ? enableWithPermission({ calendarEnabled: true })
                : update({ calendarEnabled: false })
            }
          />
        </SettingRow>
        <SettingRow
          label="Notification sound"
          hint="Play an audio alert for calendar reminders."
        >
          <Switch
            checked={prefs.calendarSound}
            onCheckedChange={(checked) => update({ calendarSound: checked })}
          />
        </SettingRow>
        <SettingRow
          label="Parse email invitations"
          hint="Detect calendar invitations in email attachments and show calendar actions."
        >
          <Switch
            checked={prefs.parseInvitations}
            onCheckedChange={(checked) => update({ parseInvitations: checked })}
          />
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Notification sound">
        <SettingRow
          label="Sound"
          hint="Select a notification tone and click the speaker icon to preview it."
        >
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Preview sound"
              onClick={() => previewNotificationSound(prefs.sound)}
            >
              <Volume2 className="size-4" />
            </Button>
            <Select
              value={prefs.sound}
              onValueChange={(value) => {
                if (isNotificationSound(value)) update({ sound: value })
              }}
            >
              <SelectTrigger className="w-44" aria-label="Notification sound">
                <SelectValue>
                  {NOTIFICATION_SOUNDS.find((s) => s.value === prefs.sound)
                    ?.label ?? "Default (Beep)"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_SOUNDS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Background notifications">
        <SettingRow
          label="Enable"
          hint="Receive alerts while the app is closed. Coming soon for real accounts."
        >
          <Switch
            checked={false}
            disabled
            aria-label="Enable background notifications"
          />
        </SettingRow>
      </SettingsGroup>

      <SaveState isSaving={save.isPending} isError={save.isError} />
    </div>
  )
}
