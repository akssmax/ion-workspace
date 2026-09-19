import { createFileRoute } from "@tanstack/react-router"
import { CalendarPlus } from "lucide-react"
import { cn } from "cn"
import { DocsFile, DocsPage, DocsSection } from "@/components/design-system/page"
import { Playground } from "@/components/design-system/playground"
import { CalendarEventChip } from "@/components/calendar/event-chip"
import { ACCENT_NAMES, type AccentName } from "@/lib/accents"

export const Route = createFileRoute("/design-system/calendar")({
  component: CalendarDocsPage,
  head: () => ({
    meta: [{ title: "Calendar · Design System" }],
  }),
})

function DayCell({
  day,
  isToday,
  events,
}: {
  day: string
  isToday: boolean
  events: { title: string; accent: AccentName }[]
}) {
  return (
    <div className="flex min-h-28 flex-col items-stretch gap-1 bg-background p-1.5">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
            isToday && "bg-primary font-semibold text-primary-foreground"
          )}
        >
          {day}
        </span>
        <CalendarPlus className="size-3.5 text-muted-foreground" />
      </div>
      <div className="space-y-0.5">
        {events.map((ev) => (
          <CalendarEventChip key={ev.title} title={ev.title} accent={ev.accent} />
        ))}
      </div>
    </div>
  )
}

function CalendarDocsPage() {
  return (
    <DocsPage
      title="Calendar"
      description="Custom month grid (not the date-picker primitive). Event chips use the 200-shade palette; Personal is sky, Work is violet in mock data."
    >
      <DocsSection title="Source">
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <DocsFile path="src/components/calendar/calendar-view.tsx" />
          </li>
          <li>
            <DocsFile path="src/components/calendar/event-chip.tsx" />
          </li>
        </ul>
      </DocsSection>
      <DocsSection title="Month cell">
        <Playground
          title="Day cell"
          canvasClassName="w-full"
          controls={[{ type: "boolean", name: "isToday", defaultValue: true }]}
          render={(v) => (
            <div className="w-40 overflow-hidden rounded-xl border">
              <DayCell
                day="19"
                isToday={Boolean(v.isToday)}
                events={[
                  { title: "Sync call", accent: "sky" },
                  { title: "Design review", accent: "violet" },
                ]}
              />
            </div>
          )}
          code={(v) =>
            `<span className={cn("size-6 rounded-full text-xs tabular-nums"${Boolean(v.isToday) ? ', isToday && "bg-primary text-primary-foreground"' : ""})}>19</span>`
          }
        />
      </DocsSection>
      <DocsSection title="Event chip">
        <Playground
          title="CalendarEventChip"
          controls={[
            {
              type: "select",
              name: "accent",
              options: [...ACCENT_NAMES],
              defaultValue: "violet",
            },
            { type: "text", name: "title", defaultValue: "Design review" },
            { type: "boolean", name: "selected", defaultValue: false },
          ]}
          render={(v) => (
            <CalendarEventChip
              title={String(v.title)}
              accent={v.accent as AccentName}
              selected={Boolean(v.selected)}
              className="min-w-40"
            />
          )}
          code={(v) =>
            `<CalendarEventChip title="${String(v.title)}" accent="${String(v.accent)}"${v.selected ? " selected" : ""} />`
          }
        />
      </DocsSection>
    </DocsPage>
  )
}
