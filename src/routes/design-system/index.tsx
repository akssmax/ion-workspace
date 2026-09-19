import { createFileRoute } from "@tanstack/react-router"
import { DocsCardLink, DocsPage, DocsSection } from "@/components/design-system/page"
import {
  APP_NAV,
  FOUNDATION_NAV,
  PRIMITIVE_NAV,
} from "@/content/design-system-nav"

export const Route = createFileRoute("/design-system/")({
  component: IntroductionPage,
  head: () => ({
    meta: [{ title: "Introduction · Design System" }],
  }),
})

function IntroductionPage() {
  return (
    <DocsPage
      title="Workspace Design System"
      description="Colors, type, and the React components behind mail, calendar, contacts, and files. Accents use Tailwind 200 fills with 800 text so chips stay readable on light and dark surfaces."
    >
      <DocsSection
        title="Foundations"
        description="Tokens first. Product UI is assembled from these surfaces, accents, and the Inter Variable scale."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FOUNDATION_NAV.map((item) => (
            <DocsCardLink key={item.href} {...item} />
          ))}
        </div>
      </DocsSection>
      <DocsSection
        title="Primitives"
        description="shadcn base-luma components wrapping Base UI. Each page has an interactive playground and live source."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRIMITIVE_NAV.map((item) => (
            <DocsCardLink key={item.href} {...item} />
          ))}
        </div>
      </DocsSection>
      <DocsSection
        title="App"
        description="How those primitives are composed in each product surface. Playgrounds use fixture props — they do not talk to JMAP."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {APP_NAV.map((item) => (
            <DocsCardLink key={item.href} {...item} />
          ))}
        </div>
      </DocsSection>
    </DocsPage>
  )
}
