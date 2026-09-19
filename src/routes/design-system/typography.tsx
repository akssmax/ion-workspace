import { createFileRoute } from "@tanstack/react-router"
import { DocsPage, DocsSection } from "@/components/design-system/page"
import { CodeBlock } from "@/components/design-system/code-block"

export const Route = createFileRoute("/design-system/typography")({
  component: TypographyPage,
  head: () => ({
    meta: [{ title: "Typography · Design System" }],
  }),
})

const SCALE = [
  {
    className: "text-4xl font-semibold tracking-tight",
    label: "text-4xl · font-semibold",
    sample: "Workspace",
    usage: "Docs page titles",
  },
  {
    className: "text-3xl font-semibold tracking-tight",
    label: "text-3xl · font-semibold",
    sample: "Inbox settings",
    usage: "Section titles",
  },
  {
    className: "text-2xl font-semibold",
    label: "text-2xl · font-semibold",
    sample: "Workspace",
    usage: "Landing heading",
  },
  {
    className: "text-xl font-semibold",
    label: "text-xl · font-semibold",
    sample: "Sign in",
    usage: "Auth heading",
  },
  {
    className: "text-lg font-semibold",
    label: "text-lg · font-semibold",
    sample: "Foundations",
    usage: "Docs section headings",
  },
  {
    className: "text-sm font-semibold",
    label: "text-sm · font-semibold",
    sample: "Q3 launch planning",
    usage: "Unread senders, view titles",
  },
  {
    className: "text-sm",
    label: "text-sm",
    sample: "Your JMAP-native mail, calendar, contacts & files app.",
    usage: "Body UI copy",
  },
  {
    className: "text-xs text-muted-foreground tabular-nums",
    label: "text-xs · muted · tabular-nums",
    sample: "2:14 PM",
    usage: "Timestamps, counts, meta",
  },
  {
    className: "text-[10px] font-medium",
    label: "text-[10px] · font-medium",
    sample: "Work",
    usage: "Label chips, event chips",
  },
]

function TypographyPage() {
  return (
    <DocsPage
      title="Typography"
      description="Inter Variable is the only family. Product UI is mostly 14px (text-sm); chips and timestamps drop to 11–12px. Tabular nums on times and unread counts."
    >
      <DocsSection title="Font">
        <p className="text-sm text-muted-foreground">
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
            Inter Variable
          </code>{" "}
          via <code className="font-mono text-xs">--font-sans</code>. Headings
          reuse the same family.
        </p>
        <div className="mt-4">
          <CodeBlock
            lang="css"
            code={`@theme inline {\n  --font-sans: "Inter Variable", sans-serif;\n  --font-heading: var(--font-sans);\n}`}
          />
        </div>
      </DocsSection>
      <DocsSection title="Scale">
        <div className="divide-y rounded-2xl border">
          {SCALE.map((row) => (
            <div
              key={row.label}
              className="grid gap-3 px-4 py-5 md:grid-cols-[minmax(0,1fr)_12rem]"
            >
              <p className={row.className}>{row.sample}</p>
              <div className="text-xs text-muted-foreground">
                <p className="font-mono">{row.label}</p>
                <p className="mt-1">{row.usage}</p>
              </div>
            </div>
          ))}
        </div>
      </DocsSection>
      <DocsSection title="Weights">
        <div className="flex flex-wrap gap-8 text-2xl">
          <span className="font-normal">Regular 400</span>
          <span className="font-medium">Medium 500</span>
          <span className="font-semibold">Semibold 600</span>
        </div>
      </DocsSection>
    </DocsPage>
  )
}
