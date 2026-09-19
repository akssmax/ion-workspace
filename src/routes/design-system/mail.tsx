import { createFileRoute } from "@tanstack/react-router"
import { Paperclip, Star } from "lucide-react"
import { cn } from "cn"
import { DocsFile, DocsPage, DocsSection } from "@/components/design-system/page"
import { Playground } from "@/components/design-system/playground"
import { LabelChip } from "@/modules/mail/labels"
import { SendStatusBanner } from "@/components/mail/send-status"
import { ACCENT_NAMES, type AccentName } from "@/lib/accents"
import type { ListDensity } from "@/lib/inbox-layout"

export const Route = createFileRoute("/design-system/mail")({
  component: MailPage,
  head: () => ({
    meta: [{ title: "Mail · Design System" }],
  }),
})

function MailListRow({
  sender,
  subject,
  preview,
  time,
  unread,
  featured,
  selected,
  density,
  showSnippets,
  labels,
  starred,
  attachment,
}: {
  sender: string
  subject: string
  preview: string
  time: string
  unread: boolean
  featured: boolean
  selected: boolean
  density: ListDensity
  showSnippets: boolean
  labels: { name: string; accent: AccentName }[]
  starred: boolean
  attachment: boolean
}) {
  const badges = (
    <>
      {labels.map((l) => (
        <LabelChip key={l.name} name={l.name} accent={l.accent} />
      ))}
      {attachment ? (
        <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
      ) : null}
      {starred ? (
        <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
      ) : null}
    </>
  )

  if (density === "compact") {
    return (
      <div
        className={cn(
          "flex w-full items-center gap-2 border-b px-3 py-1.5 text-left text-sm",
          featured ? "bg-accent" : selected ? "bg-accent/40" : "bg-background"
        )}
      >
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            unread ? "bg-primary" : "bg-transparent"
          )}
        />
        <span className={cn("w-32 shrink-0 truncate", unread && "font-semibold")}>
          {sender}
        </span>
        <span className="min-w-0 flex-1 truncate">
          <span className={unread ? "font-medium" : "text-foreground/80"}>
            {subject}
          </span>
          {showSnippets ? (
            <span className="text-muted-foreground/80"> – {preview}</span>
          ) : null}
        </span>
        <span className="flex items-center gap-1">{badges}</span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {time}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-0.5 border-b px-3 text-left",
        density === "cozy" ? "py-1.5" : "py-2.5",
        featured ? "bg-accent" : selected ? "bg-accent/40" : "bg-background"
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            unread ? "bg-primary" : "bg-transparent"
          )}
        />
        <span
          className={cn("min-w-0 flex-1 truncate text-sm", unread && "font-semibold")}
        >
          {sender}
        </span>
        <span className="flex items-center gap-1">{badges}</span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {time}
        </span>
      </div>
      <span
        className={cn(
          "truncate pl-4 text-sm",
          unread ? "font-medium" : "text-foreground/80"
        )}
      >
        {subject}
      </span>
      {showSnippets ? (
        <span className="truncate pl-4 text-xs text-muted-foreground/80">
          {preview}
        </span>
      ) : null}
    </div>
  )
}

function MailPage() {
  return (
    <DocsPage
      title="Mail"
      description="Thread list, 200-shade label chips, composer chrome, and the send-status pill. Rows below are fixture markup matching src/components/mail/email-list.tsx."
    >
      <DocsSection title="Source">
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <DocsFile path="src/components/mail/email-list.tsx" />
          </li>
          <li>
            <DocsFile path="src/modules/mail/labels/label-chip.tsx" />
          </li>
          <li>
            <DocsFile path="src/components/mail/composer.tsx" />
          </li>
          <li>
            <DocsFile path="src/components/mail/send-status.tsx" />
          </li>
        </ul>
      </DocsSection>
      <DocsSection title="List row">
        <Playground
          title="EmailRow"
          canvasClassName="w-full p-0"
          controls={[
            {
              type: "select",
              name: "density",
              options: ["comfortable", "cozy", "compact"],
              defaultValue: "comfortable",
            },
            { type: "boolean", name: "unread", defaultValue: true },
            { type: "boolean", name: "selected", defaultValue: false },
            { type: "boolean", name: "starred", defaultValue: true },
            { type: "boolean", name: "showSnippets", defaultValue: true },
          ]}
          render={(v) => (
            <div className="w-full max-w-xl overflow-hidden rounded-none">
              <MailListRow
                sender="Sally Rhodes"
                subject="Q3 launch planning — updated schedule"
                preview="Hi team — here's the updated schedule for the Q3 launch."
                time="3d"
                unread={Boolean(v.unread)}
                featured={false}
                selected={Boolean(v.selected)}
                density={String(v.density) as ListDensity}
                showSnippets={Boolean(v.showSnippets)}
                labels={[{ name: "Work", accent: "teal" }]}
                starred={Boolean(v.starred)}
                attachment
              />
            </div>
          )}
          code={(v) =>
            `// density=${String(v.density)} unread=${String(v.unread)} selected=${String(v.selected)}`
          }
        />
      </DocsSection>
      <DocsSection title="Labels">
        <Playground
          title="LabelChip"
          controls={[
            {
              type: "select",
              name: "accent",
              options: [...ACCENT_NAMES],
              defaultValue: "violet",
            },
            { type: "text", name: "name", defaultValue: "Later" },
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
              className="relative"
            />
          )}
          code={(v) => `<SendStatusBanner state="${String(v.state)}" />`}
        />
      </DocsSection>
    </DocsPage>
  )
}
