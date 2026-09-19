/**
 * Inbox settings: reading-pane position, list density and snippet
 * visibility. Migrated from the old settings modal — same instant-save
 * behaviour via useSaveInboxLayout.
 */

import { EyeOff, PanelBottom, PanelRight } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { cn } from "cn"
import { useInboxLayout, useSaveInboxLayout, usePreferences, useSavePreferences } from "@/queries/preferences"
import type {
  ListDensity,
  ReadingPanePosition,
  RowStyle,
} from "@/lib/inbox-layout"
import { SaveState } from "./settings-page"

const READING_PANE_OPTIONS: {
  value: ReadingPanePosition
  icon: React.ReactNode
  title: string
  hint: string
}[] = [
  {
    value: "right",
    icon: <PanelRight className="size-5" />,
    title: "Right",
    hint: "List beside the reading pane",
  },
  {
    value: "bottom",
    icon: <PanelBottom className="size-5" />,
    title: "Bottom",
    hint: "List above, reading below",
  },
  {
    value: "hidden",
    icon: <EyeOff className="size-5" />,
    title: "Hidden",
    hint: "Full list, open to read",
  },
]

const DENSITY_OPTIONS: {
  value: ListDensity
  title: string
  hint: string
}[] = [
  { value: "comfortable", title: "Comfortable", hint: "Roomy rows" },
  { value: "cozy", title: "Cozy", hint: "Balanced spacing" },
  { value: "compact", title: "Compact", hint: "Tight single-line rows" },
]

const ROW_STYLE_OPTIONS: {
  value: RowStyle
  title: string
  hint: string
  preview: React.ReactNode
}[] = [
  {
    value: "minimal",
    title: "Minimal",
    hint: "Text-only rows",
    preview: (
      <span className="flex w-full flex-col gap-1 px-1">
        <span className="h-1.5 w-3/4 rounded-full bg-current opacity-70" />
        <span className="h-1.5 w-1/2 rounded-full bg-current opacity-40" />
      </span>
    ),
  },
  {
    value: "gmail",
    title: "Gmail",
    hint: "Single line, avatar checkbox",
    preview: (
      <span className="flex w-full items-center gap-1.5 px-1">
        <span className="size-3.5 shrink-0 rounded-full bg-current opacity-60" />
        <span className="flex flex-1 flex-col gap-1">
          <span className="h-1.5 w-full rounded-full bg-current opacity-70" />
        </span>
      </span>
    ),
  },
  {
    value: "outlook",
    title: "Outlook",
    hint: "Avatar, subject and preview lines",
    preview: (
      <span className="flex w-full items-start gap-1.5 px-1">
        <span className="mt-0.5 size-3.5 shrink-0 rounded-full bg-current opacity-60" />
        <span className="flex flex-1 flex-col gap-1">
          <span className="h-1.5 w-2/3 rounded-full bg-current opacity-70" />
          <span className="h-1.5 w-1/2 rounded-full bg-current opacity-40" />
        </span>
      </span>
    ),
  },
]

export function InboxSection() {
  const layout = useInboxLayout()
  const save = useSaveInboxLayout()
  const { data: preferences } = usePreferences()
  const savePreferences = useSavePreferences()

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <Label>Reading pane</Label>
        <div className="grid grid-cols-3 gap-2">
          {READING_PANE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={layout.readingPane === opt.value}
              onClick={() => void save.mutateAsync({ readingPane: opt.value })}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-colors",
                layout.readingPane === opt.value
                  ? "border-primary/60 bg-accent"
                  : "hover:bg-muted/60"
              )}
            >
              {opt.icon}
              <span className="text-sm font-medium">{opt.title}</span>
              <span className="text-[11px] leading-tight text-muted-foreground">
                {opt.hint}
              </span>
            </button>
          ))}
        </div>
      </section>

      <Separator />

      <section className="space-y-2">
        <Label>List density</Label>
        <div className="grid grid-cols-3 gap-2">
          {DENSITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={layout.listDensity === opt.value}
              onClick={() => void save.mutateAsync({ listDensity: opt.value })}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-colors",
                layout.listDensity === opt.value
                  ? "border-primary/60 bg-accent"
                  : "hover:bg-muted/60"
              )}
            >
              <span className="text-sm font-medium">{opt.title}</span>
              <span className="text-[11px] leading-tight text-muted-foreground">
                {opt.hint}
              </span>
            </button>
          ))}
        </div>
      </section>

      <Separator />

      <section className="space-y-2">
        <Label>Row style</Label>
        <div className="grid grid-cols-3 gap-2">
          {ROW_STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={layout.rowStyle === opt.value}
              onClick={() => void save.mutateAsync({ rowStyle: opt.value })}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-colors",
                layout.rowStyle === opt.value
                  ? "border-primary/60 bg-accent"
                  : "hover:bg-muted/60"
              )}
            >
              <span className="flex h-6 w-full items-center text-foreground/70">
                {opt.preview}
              </span>
              <span className="text-sm font-medium">{opt.title}</span>
              <span className="text-[11px] leading-tight text-muted-foreground">
                {opt.hint}
              </span>
            </button>
          ))}
        </div>
      </section>

      <Separator />

      <section className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="inbox-snippets">Preview text</Label>
          <p className="text-xs text-muted-foreground">
            Show the first line of each message under its subject.
          </p>
        </div>
        <Switch
          id="inbox-snippets"
          checked={layout.showSnippets}
          onCheckedChange={(checked) =>
            void save.mutateAsync({ showSnippets: checked })
          }
        />
      </section>

      <SaveState isSaving={save.isPending} isError={save.isError} />
      <Separator />
      <section className="space-y-2">
        <Label htmlFor="message-actions-position">Message actions</Label>
        <p className="text-xs text-muted-foreground">Place archive, spam and reply actions above or below the email.</p>
        <select id="message-actions-position" className="w-full rounded-lg border bg-background p-2 text-sm" value={preferences?.messageActionsPosition ?? "top"} onChange={(event) => void savePreferences.mutateAsync({ messageActionsPosition: event.target.value as "top" | "bottom" })}>
          <option value="top">Above messages</option>
          <option value="bottom">Below messages</option>
        </select>
      </section>
      <SaveState isSaving={savePreferences.isPending} isError={savePreferences.isError} />
    </div>
  )
}
