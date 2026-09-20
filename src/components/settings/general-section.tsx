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
import { SettingsGroup } from "./settings-group"
import { LANGUAGES, useLanguage } from "@/lib/language"

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
function labelFor(options: readonly { value: string; label: string }[]) {
  return (value: string) =>
    options.find((o) => o.value === value)?.label ?? value
}

export function GeneralSection() {
  const { data: prefs } = usePreferences()
  const save = useSavePreferences()
  const setApp = useWorkspaceStore((s) => s.setApp)
  const { t } = useLanguage()

  return (
    <div className="space-y-8">
      <SettingsGroup title="Language and region">
        <SettingRow
          id="pref-language"
          label={t("Language")}
          hint={t("Used across the workspace interface.")}
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
          label={t("Timezone")}
          hint={t("Used for dates and times across mail and calendar.")}
        >
          <Select
            value={prefs?.timezone ?? "auto"}
            onValueChange={(value) =>
              void save.mutateAsync({ timezone: value as string })
            }
          >
            <SelectTrigger id="pref-timezone" className="w-52">
              <SelectValue>
                {(value: string) =>
                  value === "auto"
                    ? t("Automatic (device)")
                    : labelFor(TIMEZONES)(value)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.value === "auto" ? t("Automatic (device)") : tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        <Separator />

        <SettingRow
          id="pref-calendar-week-start"
          label="Calendar week starts on"
          hint="Applies to Month and Week views."
        >
          <Select
            value={prefs?.calendarWeekStart ?? "locale"}
            onValueChange={(value) =>
              void save.mutateAsync({
                calendarWeekStart: value as
                  "locale" | "sunday" | "monday" | "saturday",
              })
            }
          >
            <SelectTrigger id="pref-calendar-week-start" className="w-52">
              <SelectValue>
                {labelFor([
                  { value: "locale", label: "Language default" },
                  { value: "sunday", label: "Sunday" },
                  { value: "monday", label: "Monday" },
                  { value: "saturday", label: "Saturday" },
                ])}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="locale">Language default</SelectItem>
              <SelectItem value="sunday">Sunday</SelectItem>
              <SelectItem value="monday">Monday</SelectItem>
              <SelectItem value="saturday">Saturday</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Workspace defaults">
        <SettingRow
          id="pref-default-view"
          label={t("Default app")}
          hint={t("The app you land in. Changing it switches you there now.")}
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
              <SelectValue>
                {(value: string) =>
                  t(
                    labelFor(APPS)(value) as
                      "Mail" | "Calendar" | "Contacts" | "Files"
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {APPS.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {t(a.label as "Mail" | "Calendar" | "Contacts" | "Files")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        <Separator />

        <SettingRow
          id="pref-density"
          label={t("Display density")}
          hint={t("Overall spacing of the interface.")}
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
              <SelectValue>
                {(value: string) =>
                  t(labelFor(DENSITIES)(value) as "Comfortable" | "Compact")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {DENSITIES.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {t(d.label as "Comfortable" | "Compact")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        <SaveState isSaving={save.isPending} isError={save.isError} />
      </SettingsGroup>
    </div>
  )
}
