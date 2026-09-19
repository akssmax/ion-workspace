import { createFileRoute, notFound } from "@tanstack/react-router"
import { DocsFile, DocsPage } from "@/components/design-system/page"
import { primitiveBySlug } from "@/design-system/primitives"

export const Route = createFileRoute("/design-system/components/$slug")({
  component: PrimitiveRoute,
  head: ({ params }) => {
    const doc = primitiveBySlug(params.slug)
    return {
      meta: [{ title: `${doc?.title ?? params.slug} · Design System` }],
    }
  },
})

function PrimitiveRoute() {
  const { slug } = Route.useParams()
  const doc = primitiveBySlug(slug)
  if (!doc) throw notFound()

  return (
    <DocsPage title={doc.title} description={doc.description}>
      <p className="-mt-8 mb-8">
        <DocsFile path={doc.file} />
      </p>
      <div className="space-y-12">
        <doc.Page />
      </div>
    </DocsPage>
  )
}
