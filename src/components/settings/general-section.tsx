/**
 * General settings: language, timezone, default app and display density.
 * All controls save instantly via the preferences RPC (optimistic).
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { usePreferences, useSavePreferences } from "@/queries/preferences"
import { useWorkspaceStore } from "@/stores/workspace.store"
import type { WorkspaceApp } from "@/stores/workspace.store"
import { SaveState, SettingRow } from "./settings-page"

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
]

const TIMEZONES = [
  { value: "auto", label: "Automatic (device)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "America/New_York", label: "New York (ET)" },
  { value: "America/Chicago", label: "Chicago (CT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
]

const APPS: { value: WorkspaceApp; label: string }[] = [
  { value: "mail", label: "Mail" },
  { value: "calendar", label: "Calendar" },
  { value: "contacts", label: "Contacts" },
  { value: "files", label: "Files" },
]

const DENSITIES = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
]

/** SelectValue render prop: map the raw value to its display label. */
function labelFor(options: { value: string; label: string }[]) {
  return (value: string) =>
    options.find((o) => o.value === value)?.label ?? value
}

export function GeneralSection() {
  const { data: prefs } = usePreferences()
  const save = useSavePreferences()
  const setApp = useWorkspaceStore((s) => s.setApp)

  return (
    <div>
      <SettingRow
        id="pref-language"
        label="Language"
        hint="Used across the workspace interface."
      >
        <Select
          value={prefs?.language ?? "en"}
          onValueChange={(value) =>
            void save.mutateAsync({ language: value as string })
          }
        >
          <SelectTrigger id="pref-language" className="w-52">
            <SelectValue>{labelFor(LANGUAGES)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <Separator />

      <SettingRow
        id="pref-timezone"
        label="Timezone"
        hint="Used for dates and times across mail and calendar."
      >
        <Select
          value={prefs?.timezone ?? "auto"}
          onValueChange={(value) =>
            void save.mutateAsync({ timezone: value as string })
          }
        >
          <SelectTrigger id="pref-timezone" className="w-52">
            <SelectValue>{labelFor(TIMEZONES)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <Separator />

      <SettingRow
        id="pref-default-view"
        label="Default app"
        hint="The app you land in. Changing it switches you there now."
      >
        <Select
          value={prefs?.defaultView ?? "mail"}
          onValueChange={(value) => {
            const app = value as WorkspaceApp
            void save.mutateAsync({ defaultView: app })
            setApp(app)
          }}
        >
          <SelectTrigger id="pref-default-view" className="w-52">
            <SelectValue>{labelFor(APPS)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {APPS.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <Separator />

      <SettingRow
        id="pref-density"
        label="Display density"
        hint="Overall spacing of the interface."
      >
        <Select
          value={prefs?.displayDensity ?? "comfortable"}
          onValueChange={(value) =>
            void save.mutateAsync({
              displayDensity: value as "comfortable" | "compact",
            })
          }
        >
          <SelectTrigger id="pref-density" className="w-52">
            <SelectValue>{labelFor(DENSITIES)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DENSITIES.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SaveState isSaving={save.isPending} isError={save.isError} />
    </div>
  )
}
