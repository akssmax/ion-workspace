import { createFileRoute } from "@tanstack/react-router"
import { File as FileIcon, Folder, Trash2 } from "lucide-react"
import { DocsFile, DocsPage, DocsSection } from "@/components/design-system/page"
import { Playground } from "@/components/design-system/playground"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/design-system/files")({
  component: FilesPage,
  head: () => ({
    meta: [{ title: "Files · Design System" }],
  }),
})

function FileCard({
  name,
  meta,
  kind,
}: {
  name: string
  meta: string
  kind: "file" | "folder"
}) {
  return (
    <div className="group flex w-44 flex-col rounded-xl border bg-card p-3">
      {kind === "folder" ? (
        <Folder className="size-8 text-primary" />
      ) : (
        <FileIcon className="size-8 text-muted-foreground" />
      )}
      <p className="mt-2 w-full truncate text-sm font-medium">{name}</p>
      <div className="mt-2 flex w-full items-center gap-2 text-xs text-muted-foreground">
        <span className="min-w-0 flex-1 truncate">{meta}</span>
        <span className="shrink-0 tabular-nums">Sep 19</span>
      </div>
      <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon-sm" aria-label={`Delete ${name}`}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function FilesPage() {
  return (
    <DocsPage
      title="Files"
      description="Card grid over the node tree. Folders use primary; files use muted icons. The product trail is a custom breadcrumb, not the Breadcrumb primitive."
    >
      <DocsSection title="Source">
        <DocsFile path="src/components/files/files-view.tsx" />
      </DocsSection>
      <DocsSection title="Cards">
        <Playground
          title="File card"
          controls={[
            {
              type: "select",
              name: "kind",
              options: ["folder", "file"],
              defaultValue: "folder",
            },
            { type: "text", name: "name", defaultValue: "Documents" },
            { type: "text", name: "meta", defaultValue: "3 items" },
          ]}
          render={(v) => (
            <FileCard
              name={String(v.name)}
              meta={String(v.meta)}
              kind={v.kind as "file" | "folder"}
            />
          )}
          code={(v) =>
            `<div className="rounded-xl border bg-card p-3">\n  <${v.kind === "folder" ? "Folder className=\"size-8 text-primary\"" : "FileIcon className=\"size-8 text-muted-foreground\""} />\n  <p className="mt-2 text-sm font-medium">${String(v.name)}</p>\n</div>`
          }
        />
      </DocsSection>
    </DocsPage>
  )
}
