import { createFileRoute } from "@tanstack/react-router"
import { DocsPage, DocsSection } from "@/components/design-system/page"
import { ColorSwatch } from "@/components/design-system/swatch"

export const Route = createFileRoute("/design-system/colors")({
  component: ColorsPage,
  head: () => ({
    meta: [{ title: "Colors · Design System" }],
  }),
})

const SURFACES = [
  { name: "Background", cssVar: "--background", className: "bg-background" },
  { name: "Foreground", cssVar: "--foreground", className: "bg-foreground" },
  { name: "Card", cssVar: "--card", className: "bg-card" },
  { name: "Popover", cssVar: "--popover", className: "bg-popover" },
  { name: "Muted", cssVar: "--muted", className: "bg-muted" },
  { name: "Secondary", cssVar: "--secondary", className: "bg-secondary" },
  { name: "Accent", cssVar: "--accent", className: "bg-accent" },
  { name: "Border", cssVar: "--border", className: "bg-border" },
  { name: "Input", cssVar: "--input", className: "bg-input" },
  { name: "Ring", cssVar: "--ring", className: "bg-ring" },
]

const BRAND = [
  { name: "Primary", cssVar: "--primary", className: "bg-primary" },
  {
    name: "Primary foreground",
    cssVar: "--primary-foreground",
    className: "bg-primary-foreground",
  },
  { name: "Destructive", cssVar: "--destructive", className: "bg-destructive" },
  { name: "Success", cssVar: "--success", className: "bg-success" },
  { name: "Warning", cssVar: "--warning", className: "bg-warning" },
  { name: "Info", cssVar: "--info", className: "bg-info" },
]

const SIDEBAR = [
  { name: "Sidebar", cssVar: "--sidebar", className: "bg-sidebar" },
  {
    name: "Sidebar primary",
    cssVar: "--sidebar-primary",
    className: "bg-sidebar-primary",
  },
  {
    name: "Sidebar accent",
    cssVar: "--sidebar-accent",
    className: "bg-sidebar-accent",
  },
  {
    name: "Sidebar border",
    cssVar: "--sidebar-border",
    className: "bg-sidebar-border",
  },
]

const CHARTS = [
  { name: "Chart 1", cssVar: "--chart-1", className: "bg-chart-1" },
  { name: "Chart 2", cssVar: "--chart-2", className: "bg-chart-2" },
  { name: "Chart 3", cssVar: "--chart-3", className: "bg-chart-3" },
  { name: "Chart 4", cssVar: "--chart-4", className: "bg-chart-4" },
  { name: "Chart 5", cssVar: "--chart-5", className: "bg-chart-5" },
]

function SwatchGrid({
  items,
}: {
  items: { name: string; cssVar: string; className: string }[]
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <ColorSwatch key={item.cssVar} {...item} />
      ))}
    </div>
  )
}

function ColorsPage() {
  return (
    <DocsPage
      title="Colors"
      description="Semantic OKLCH tokens. --accent is the neutral hover surface, not a brand hue. Brand teal lives on --primary. Click a swatch to copy the Tailwind class."
    >
      <DocsSection title="Surfaces" description="Page, card, muted, and chrome.">
        <SwatchGrid items={SURFACES} />
      </DocsSection>
      <DocsSection
        title="Brand and status"
        description="Primary is teal (~hue 186). Success, warning, and info are Tailwind 200/800 pairs."
      >
        <SwatchGrid items={BRAND} />
      </DocsSection>
      <DocsSection title="Sidebar">
        <SwatchGrid items={SIDEBAR} />
      </DocsSection>
      <DocsSection title="Charts" description="Grayscale steps reserved for future charts.">
        <SwatchGrid items={CHARTS} />
      </DocsSection>
    </DocsPage>
  )
}
