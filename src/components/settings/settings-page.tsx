/**
 * Settings page (/settings) — full-page replacement for the old settings
 * modal. Left section nav + content area; the active section lives in the
 * `?section=` search param so every section is deep-linkable.
 *
 * Feature modules can add their own blocks to the Features section via the
 * `settingsSections` contribution point (see src/features/contributions.ts).
 */

import { ArrowLeft, Inbox, Keyboard, Sparkles, UserRound, SlidersHorizontal, Palette } from "lucide-react"
import { useNavigate, useSearch } from "@tanstack/react-router"
import "@/features/catalog"
import { Button } from "@/components/ui/button"
import { cn } from "cn"
import { GeneralSection } from "./general-section"
import { AppearanceSection } from "./appearance-section"
import { InboxSection } from "./inbox-section"
import { FeaturesSection } from "./features-section"
import { ShortcutsSection } from "./shortcuts-section"
import { AccountSection } from "./account-section"

export const SETTINGS_SECTION_IDS = [
  "general",
  "appearance",
  "inbox",
  "features",
  "shortcuts",
  "account",
] as const

export type SettingsSectionId = (typeof SETTINGS_SECTION_IDS)[number]

const SECTIONS: {
  id: SettingsSectionId
  title: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    id: "general",
    title: "General",
    description: "Language, timezone and workspace defaults",
    icon: <SlidersHorizontal className="size-4" />,
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Theme, type, scale, and color vision",
    icon: <Palette className="size-4" />,
  },
  {
    id: "inbox",
    title: "Inbox",
    description: "Reading pane, density and previews",
    icon: <Inbox className="size-4" />,
  },
  {
    id: "features",
    title: "Features",
    description: "Turn optional capabilities on or off",
    icon: <Sparkles className="size-4" />,
  },
  {
    id: "shortcuts",
    title: "Shortcuts",
    description: "Keyboard shortcut reference",
    icon: <Keyboard className="size-4" />,
  },
  {
    id: "account",
    title: "Account",
    description: "Profile and session",
    icon: <UserRound className="size-4" />,
  },
]

export function SettingsPage() {
  const { section } = useSearch({ from: "/settings" })
  const navigate = useNavigate()
  const active = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0]

  function pick(id: SettingsSectionId) {
    void navigate({ to: "/settings", search: { section: id }, replace: true })
  }

  return (
    <div className="flex h-svh flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to workspace"
          onClick={() => void navigate({ to: "/app" })}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-sm font-semibold">Settings</h1>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Settings sections"
          className="w-60 shrink-0 space-y-0.5 overflow-y-auto border-r p-3"
        >
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pick(s.id)}
              aria-current={s.id === active.id ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                s.id === active.id
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {s.icon}
              {s.title}
            </button>
          ))}
        </nav>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-8 py-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">{active.title}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {active.description}
              </p>
            </div>
            {active.id === "general" ? <GeneralSection /> : null}
            {active.id === "appearance" ? <AppearanceSection /> : null}
            {active.id === "inbox" ? <InboxSection /> : null}
            {active.id === "features" ? <FeaturesSection /> : null}
            {active.id === "shortcuts" ? <ShortcutsSection /> : null}
            {active.id === "account" ? <AccountSection /> : null}
          </div>
        </main>
      </div>
    </div>
  )
}

/** Shared labelled row used by several sections. */
export function SettingRow({
  id,
  label,
  hint,
  children,
}: {
  id?: string
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div className="space-y-0.5">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      {children}
    </div>
  )
}

/** Save-state line shared by sections that persist via preferences. */
export function SaveState({
  isSaving,
  isError,
}: {
  isSaving: boolean
  isError: boolean
}) {
  if (isSaving) {
    return <p className="pt-2 text-xs text-muted-foreground">Saving…</p>
  }
  if (isError) {
    return (
      <p className="pt-2 text-xs text-destructive">
        Couldn&apos;t save — please try again.
      </p>
    )
  }
  return null
}