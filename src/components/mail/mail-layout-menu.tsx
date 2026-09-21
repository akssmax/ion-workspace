/**
 * Mail layout controls — reading pane, list density, row style and snippet
 * visibility. Shared by Settings → Inbox and the header popover so both stay
 * in sync.
 */

import { EyeOff, LayoutList, PanelBottom, PanelRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { cn } from "cn"
import { useInboxLayout, useSaveInboxLayout } from "@/queries/preferences"
import type {
  ListDensity,
  ReadingPanePosition,
  RowStyle,
  UnreadStyle,
} from "@/lib/inbox-layout"

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

const UNREAD_STYLE_OPTIONS: {
  value: UnreadStyle
  title: string
  hint: string
}[] = [
  { value: "dot", title: "Dot", hint: "Colored dot marks unread" },
  { value: "fill", title: "Fill", hint: "Tint read and unread rows" },
  { value: "none", title: "None", hint: "Bold text only" },
]

export function MailLayoutControls({ compact = false }: { compact?: boolean }) {
  const layout = useInboxLayout()
  const save = useSaveInboxLayout()
  const grid = compact
    ? "grid-cols-3 gap-1.5"
    : "grid-cols-1 gap-2 md:grid-cols-3"
  const card = compact
    ? "gap-1 rounded-lg px-1.5 py-2"
    : "gap-1 rounded-xl px-2 py-3"
  const section = compact ? "space-y-2 py-2" : "space-y-2 py-4"
  const title = compact ? "text-xs font-medium" : "text-sm font-medium"

  return (
    <div className={compact ? "space-y-1" : "divide-y"}>
      <section className={section}>
        <Label>Reading pane</Label>
        <div className={cn("grid", grid)}>
          {READING_PANE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={layout.readingPane === opt.value}
              onClick={() => void save.mutateAsync({ readingPane: opt.value })}
              className={cn(
                "flex flex-col items-center border text-center transition-colors",
                card,
                layout.readingPane === opt.value
                  ? "border-primary/60 bg-accent"
                  : "hover:bg-muted/60"
              )}
            >
              {opt.icon}
              <span className={title}>{opt.title}</span>
              {compact ? null : (
                <span className="text-[11px] leading-tight text-muted-foreground">
                  {opt.hint}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className={section}>
        <Label>List density</Label>
        <div className={cn("grid", grid)}>
          {DENSITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={layout.listDensity === opt.value}
              onClick={() => void save.mutateAsync({ listDensity: opt.value })}
              className={cn(
                "flex flex-col items-center border text-center transition-colors",
                card,
                layout.listDensity === opt.value
                  ? "border-primary/60 bg-accent"
                  : "hover:bg-muted/60"
              )}
            >
              <span className={title}>{opt.title}</span>
              {compact ? null : (
                <span className="text-[11px] leading-tight text-muted-foreground">
                  {opt.hint}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className={section}>
        <Label>Row style</Label>
        <div className={cn("grid", grid)}>
          {ROW_STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={layout.rowStyle === opt.value}
              onClick={() => void save.mutateAsync({ rowStyle: opt.value })}
              className={cn(
                "flex flex-col items-center border text-center transition-colors",
                card,
                layout.rowStyle === opt.value
                  ? "border-primary/60 bg-accent"
                  : "hover:bg-muted/60"
              )}
            >
              <span
                className={cn(
                  "flex w-full items-center text-foreground/70",
                  compact ? "h-5" : "h-6"
                )}
              >
                {opt.preview}
              </span>
              <span className={title}>{opt.title}</span>
              {compact ? null : (
                <span className="text-[11px] leading-tight text-muted-foreground">
                  {opt.hint}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className={section}>
        <Label>Read/unread style</Label>
        <div className={cn("grid", grid)}>
          {UNREAD_STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={layout.unreadStyle === opt.value}
              onClick={() => void save.mutateAsync({ unreadStyle: opt.value })}
              className={cn(
                "flex flex-col items-center border text-center transition-colors",
                card,
                layout.unreadStyle === opt.value
                  ? "border-primary/60 bg-accent"
                  : "hover:bg-muted/60"
              )}
            >
              <span className={title}>{opt.title}</span>
              {compact ? null : (
                <span className="text-[11px] leading-tight text-muted-foreground">
                  {opt.hint}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section
        className={cn(
          "flex items-center justify-between gap-4",
          compact ? "py-2" : "py-4"
        )}
      >
        <div className="space-y-0.5">
          <Label htmlFor="mail-layout-snippets">Preview text</Label>
          {compact ? null : (
            <p className="text-xs text-muted-foreground">
              Show the first line of each message under its subject.
            </p>
          )}
        </div>
        <Switch
          id="mail-layout-snippets"
          checked={layout.showSnippets}
          onCheckedChange={(checked) =>
            void save.mutateAsync({ showSnippets: checked })
          }
        />
      </section>
    </div>
  )
}

export function MailLayoutMenu() {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Mail layout"
                />
              }
            />
          }
        >
          <LayoutList className="size-4" />
        </TooltipTrigger>
        <TooltipContent>Mail layout</TooltipContent>
      </Tooltip>
      <PopoverContent
        align="end"
        className="w-[22.5rem] gap-0 p-0 sm:w-[24rem]"
      >
        <PopoverHeader className="border-b px-4 py-3">
          <PopoverTitle>Mail layout</PopoverTitle>
        </PopoverHeader>
        <div className="max-h-[min(30rem,70vh)] overflow-y-auto p-4">
          <MailLayoutControls compact />
        </div>
      </PopoverContent>
    </Popover>
  )
}
