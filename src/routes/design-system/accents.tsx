import { createFileRoute } from "@tanstack/react-router"
import { DocsFile, DocsPage, DocsSection } from "@/components/design-system/page"
import { Playground } from "@/components/design-system/playground"
import { LabelChip } from "@/modules/mail/labels"
import { CalendarEventChip } from "@/components/calendar/event-chip"
import { SendStatusBanner } from "@/components/mail/send-status"
import {
  ACCENT_CLASSES,
  ACCENT_NAMES,
  accentForKey,
  type AccentName,
} from "@/lib/accents"
import { cn } from "cn"

export const Route = createFileRoute("/design-system/accents")({
  component: AccentsPage,
  head: () => ({
    meta: [{ title: "Accents · Design System" }],
  }),
})

function AccentsPage() {
  return (
    <DocsPage
      title="Accents"
      description="Tailwind 200 fills with 800 text (dark: 900 / 200). Mail labels hash a mailbox id onto this palette. Calendar colors may be a palette key or a hex from JMAP."
    >
      <DocsSection
        title="Palette"
        description="Defined in src/lib/accents.ts. Use these for chips, not for large surfaces."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {ACCENT_NAMES.map((name) => {
            const tone = ACCENT_CLASSES[name]
            return (
              <div
                key={name}
                className={cn(
                  "flex h-20 flex-col items-center justify-center rounded-xl text-sm font-medium capitalize",
                  tone.bg,
                  tone.text
                )}
              >
                {name}
                <span className="mt-1 text-[11px] opacity-70">200 / 800</span>
              </div>
            )
          })}
        </div>
      </DocsSection>
      <DocsSection title="Status">
        <div className="flex flex-wrap gap-3">
          <span className="rounded-full bg-success px-3 py-1 text-sm font-medium text-success-foreground">
            Success
          </span>
          <span className="rounded-full bg-warning px-3 py-1 text-sm font-medium text-warning-foreground">
            Warning
          </span>
          <span className="rounded-full bg-info px-3 py-1 text-sm font-medium text-info-foreground">
            Info
          </span>
          <span className="rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
            Destructive
          </span>
        </div>
      </DocsSection>
      <DocsSection title="Label chip" description="Presentational chip used on mail rows.">
        <Playground
          title="LabelChip"
          controls={[
            {
              type: "select",
              name: "accent",
              options: [...ACCENT_NAMES],
              defaultValue: "teal",
            },
            { type: "text", name: "name", label: "label", defaultValue: "Work" },
          ]}
          render={(v) => (
            <LabelChip
              name={String(v.name)}
              accent={v.accent as AccentName}
            />
          )}
          code={(v) =>
            `<LabelChip name="${String(v.name)}" accent="${String(v.accent)}" />`
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
              defaultValue: "sky",
            },
            {
              type: "text",
              name: "title",
              defaultValue: "Sync call",
            },
            { type: "boolean", name: "selected", defaultValue: false },
          ]}
          render={(v) => (
            <CalendarEventChip
              title={String(v.title)}
              accent={v.accent as AccentName}
              selected={Boolean(v.selected)}
              className="min-w-32"
            />
          )}
          code={(v) =>
            `<CalendarEventChip title="${String(v.title)}" accent="${String(v.accent)}"${v.selected ? " selected" : ""} />`
          }
        />
      </DocsSection>
      <DocsSection title="Send status">
        <Playground
          title="SendStatusBanner"
          controls={[
            {
              type: "select",
              name: "state",
              options: ["sending", "sent", "failed"],
              defaultValue: "sent",
            },
          ]}
          render={(v) => (
            <SendStatusBanner
              state={v.state as "sending" | "sent" | "failed"}
              error="The server rejected the message."
              className="relative"
            />
          )}
          code={(v) => `<SendStatusBanner state="${String(v.state)}" />`}
        />
      </DocsSection>
      <DocsSection title="Stable hashing">
        <p className="mb-3 text-sm text-muted-foreground">
          <DocsFile path="accentForKey(id)" /> maps any string onto the palette so
          new labels stay the same color across reloads.
        </p>
        <div className="flex flex-wrap gap-2">
          {["mbox_label_work", "mbox_label_personal", "mbox_label_later"].map(
            (id) => (
              <LabelChip
                key={id}
                name={id.replace("mbox_label_", "")}
                accent={accentForKey(id)}
              />
            )
          )}
        </div>
      </DocsSection>
    </DocsPage>
  )
}
