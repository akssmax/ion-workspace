import { createFileRoute } from "@tanstack/react-router"
import { DocsFile, DocsPage, DocsSection } from "@/components/design-system/page"
import { ThemeController } from "@/components/theme/theme-controller"
import { CodeBlock } from "@/components/design-system/code-block"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const Route = createFileRoute("/design-system/theme")({
  component: ThemeDocsPage,
  head: () => ({
    meta: [{ title: "Theme · Design System" }],
  }),
})

function ThemeDocsPage() {
  return (
    <DocsPage
      title="Theme"
      description="One controller for appearance, accent, base gray, radius, typeface, scale, and color vision. Tokens are written onto html so the product, docs, and login stay in sync — including future white-label brands."
    >
      <p className="-mt-8 mb-8">
        <DocsFile path="src/components/theme/theme-controller.tsx" />
      </p>

      <DocsSection
        title="Controller"
        description="The same component is in the docs header and Settings → Appearance. Changes persist in localStorage under workspace-theme."
      >
        <div className="max-w-xl rounded-2xl border p-6">
          <ThemeController />
        </div>
        <div className="mt-6">
          <CodeBlock
            lang="tsx"
            code={`import { ThemeController } from "@/components/theme/theme-controller"
import { ThemeMenu } from "@/components/theme/theme-menu"

<ThemeController />
<ThemeController variant="compact" />
<ThemeMenu />`}
          />
        </div>
      </DocsSection>

      <DocsSection
        title="Live tokens"
        description="Primary, surfaces, and status follow the controller. Color-vision modes remap unsafe hues instead of simulating deficiency."
      >
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border p-4">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Badge>Badge</Badge>
          <span className="rounded-md bg-success px-2 py-0.5 text-xs font-medium text-success-foreground">
            Success
          </span>
          <span className="rounded-md bg-warning px-2 py-0.5 text-xs font-medium text-warning-foreground">
            Warning
          </span>
          <span className="rounded-md bg-info px-2 py-0.5 text-xs font-medium text-info-foreground">
            Info
          </span>
        </div>
      </DocsSection>

      <DocsSection
        title="White-label"
        description="Ship a different default by changing DEFAULT_THEME. Components never hard-code a brand hue — they read CSS variables applied to the document."
      >
        <CodeBlock
          lang="ts"
          code={`export const DEFAULT_THEME = {
  mode: "system",
  accent: "teal",
  gray: "zinc",
  radius: "md",
  font: "inter",
  scale: "md",
  cvd: "none",
  highContrast: false,
}`}
        />
      </DocsSection>
    </DocsPage>
  )
}
