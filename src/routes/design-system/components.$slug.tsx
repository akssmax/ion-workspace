import { createFileRoute, notFound } from "@tanstack/react-router"
import { DocsFile, DocsPage } from "@/components/design-system/page"
import { PRIMITIVE_NAV } from "@/content/design-system-nav"
import { primitiveBySlug } from "@/design-system/primitives"

export const Route = createFileRoute("/design-system/components/$slug")({
  component: PrimitiveRoute,
  head: ({ params }) => {
    // Keep route metadata independent of the component gallery so it can
    // remain in the lazy route chunk instead of every page’s entry bundle.
    const doc = PRIMITIVE_NAV.find(
      (item) => item.href === `/design-system/components/${params.slug}`
    )
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
