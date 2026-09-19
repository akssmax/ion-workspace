/**
 * Settings page (/settings) — full-page replacement for the old settings
 * modal. Left section nav + content area; the active section lives in the
 * `?section=` search param so every section is deep-linkable.
 *
 * Feature modules can add their own blocks to the Features section via the
 * `settingsSections` contribution point (see src/features/contributions.ts).
 */

import { ArrowLeft, Inbox, Keyboard, Sparkles, UserRound, SlidersHorizontal, Palette, PenLine, Download, IdCard, CalendarOff, Filter, FileText, Folder, Tags, Shield, Image } from "lucide-react"
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
import { ComposingSection, ContentSection, DownloadsSection, IdentitiesSection, VacationSection, FiltersSection, TemplatesSection, FoldersSection } from "./mail-settings-sections"

export const SETTINGS_SECTION_IDS = [
  "general",
  "appearance",
  "inbox",
  "composing",
  "downloads",
  "identities",
  "vacation",
  "filters",
  "templates",
  "folders",
  "tags",
  "content",
  "security",
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
  group: string
}[] = [
  {
    id: "general",
    title: "General",
    description: "Language, timezone and workspace defaults",
    icon: <SlidersHorizontal className="size-4" />,
    group: "Workspace",
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Theme, type, scale, and color vision",
    icon: <Palette className="size-4" />,
    group: "Appearance",
  },
  {
    id: "inbox",
    title: "Inbox",
    description: "Reading pane, density and previews",
    icon: <Inbox className="size-4" />,
    group: "Mail",
  },
  { id: "composing", title: "Composing", description: "Identity, signature and reply defaults", icon: <PenLine className="size-4" />, group: "Mail" },
  { id: "downloads", title: "Downloads", description: "Email and attachment file names", icon: <Download className="size-4" />, group: "Mail" },
  { id: "identities", title: "Identities", description: "Addresses available for sending", icon: <IdCard className="size-4" />, group: "Mail" },
  { id: "vacation", title: "Vacation responder", description: "Automatic out-of-office replies", icon: <CalendarOff className="size-4" />, group: "Mail" },
  { id: "filters", title: "Filters", description: "Incoming mail rules", icon: <Filter className="size-4" />, group: "Mail" },
  { id: "templates", title: "Templates", description: "Reusable email drafts", icon: <FileText className="size-4" />, group: "Mail" },
  { id: "folders", title: "Folders", description: "Manage mailboxes", icon: <Folder className="size-4" />, group: "Mail" },
  { id: "tags", title: "Tags", description: "Organize mail with labels", icon: <Tags className="size-4" />, group: "Mail" },
  { id: "content", title: "Content & senders", description: "Images and trusted senders", icon: <Image className="size-4" />, group: "Privacy & Security" },
  { id: "security", title: "Security", description: "Connection and session safety", icon: <Shield className="size-4" />, group: "Privacy & Security" },
  {
    id: "features",
    title: "Features",
    description: "Turn optional capabilities on or off",
    icon: <Sparkles className="size-4" />,
    group: "Workspace",
  },
  {
    id: "shortcuts",
    title: "Shortcuts",
    description: "Keyboard shortcut reference",
    icon: <Keyboard className="size-4" />,
    group: "Workspace",
  },
  {
    id: "account",
    title: "Account",
    description: "Profile and session",
    icon: <UserRound className="size-4" />,
    group: "Workspace",
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

      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        <nav
          aria-label="Settings sections"
          className="flex w-full shrink-0 gap-1 overflow-x-auto border-b p-2 sm:block sm:w-60 sm:space-y-0.5 sm:overflow-y-auto sm:border-r sm:border-b-0 sm:p-3"
        >
          {SECTIONS.map((s, index) => (
            <div key={s.id} className="shrink-0">
            {(index === 0 || SECTIONS[index - 1].group !== s.group) ? <p className="hidden px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:block">{s.group}</p> : null}
            <button
              type="button"
              onClick={() => pick(s.id)}
              aria-current={s.id === active.id ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors sm:w-full sm:gap-2.5",
                s.id === active.id
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {s.icon}
              {s.title}
            </button>
            </div>
          ))}
        </nav>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-4 py-5 sm:px-8 sm:py-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">{active.title}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {active.description}
              </p>
            </div>
            {active.id === "general" ? <GeneralSection /> : null}
            {active.id === "appearance" ? <AppearanceSection /> : null}
            {active.id === "inbox" ? <InboxSection /> : null}
            {active.id === "composing" ? <ComposingSection /> : null}
            {active.id === "downloads" ? <DownloadsSection /> : null}
            {active.id === "identities" ? <IdentitiesSection /> : null}
            {active.id === "vacation" ? <VacationSection /> : null}
            {active.id === "filters" ? <FiltersSection /> : null}
            {active.id === "templates" ? <TemplatesSection /> : null}
            {active.id === "folders" || active.id === "tags" ? <FoldersSection tags={active.id === "tags"} /> : null}
            {active.id === "content" ? <ContentSection /> : null}
            {active.id === "security" ? <AccountSection /> : null}
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
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 sm:gap-6">
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
