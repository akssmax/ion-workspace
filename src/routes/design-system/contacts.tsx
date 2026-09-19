import { createFileRoute } from "@tanstack/react-router"
import { cn } from "cn"
import { DocsFile, DocsPage, DocsSection } from "@/components/design-system/page"
import { Playground } from "@/components/design-system/playground"

export const Route = createFileRoute("/design-system/contacts")({
  component: ContactsPage,
  head: () => ({
    meta: [{ title: "Contacts · Design System" }],
  }),
})

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function ContactRow({
  name,
  meta,
  selected,
}: {
  name: string
  meta: string
  selected: boolean
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 border-b px-4 py-2.5 text-left",
        selected ? "bg-accent" : "bg-background"
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {initials(name)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
    </div>
  )
}

function ContactsPage() {
  return (
    <DocsPage
      title="Contacts"
      description="Split list + detail. Rows use a primary-tinted avatar fallback, not the 200-shade palette (those hues are reserved for labels and calendars)."
    >
      <DocsSection title="Source">
        <DocsFile path="src/components/contacts/contacts-view.tsx" />
      </DocsSection>
      <DocsSection title="List row">
        <Playground
          title="Contact row"
          canvasClassName="w-full p-0"
          controls={[
            { type: "text", name: "name", defaultValue: "Sally Rhodes" },
            {
              type: "text",
              name: "meta",
              defaultValue: "sally@rhodes.engineering",
            },
            { type: "boolean", name: "selected", defaultValue: true },
          ]}
          render={(v) => (
            <div className="w-full max-w-md">
              <ContactRow
                name={String(v.name)}
                meta={String(v.meta)}
                selected={Boolean(v.selected)}
              />
            </div>
          )}
          code={(v) =>
            `<div className={cn("flex items-center gap-3 px-4 py-2.5", ${Boolean(v.selected) ? '"bg-accent"' : '"hover:bg-muted/50"'})}>\n  <div className="size-9 rounded-full bg-primary/10 text-primary">SR</div>\n  <div>\n    <p className="text-sm font-medium">${String(v.name)}</p>\n    <p className="text-xs text-muted-foreground">${String(v.meta)}</p>\n  </div>\n</div>`
          }
        />
      </DocsSection>
    </DocsPage>
  )
}
