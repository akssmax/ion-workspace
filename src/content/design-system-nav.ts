export type DesignSystemNavItem = {
  title: string
  href: string
  description?: string
}

export type DesignSystemNavGroup = {
  title: string
  items: DesignSystemNavItem[]
}

export const PRIMITIVE_NAV: DesignSystemNavItem[] = [
  { title: "Button", href: "/design-system/components/button", description: "Actions and links" },
  { title: "Badge", href: "/design-system/components/badge", description: "Compact status labels" },
  { title: "Input", href: "/design-system/components/input", description: "Single-line text fields" },
  { title: "Textarea", href: "/design-system/components/textarea", description: "Multiline text fields" },
  { title: "Label", href: "/design-system/components/label", description: "Form field captions" },
  { title: "Checkbox", href: "/design-system/components/checkbox", description: "Binary choices" },
  { title: "Switch", href: "/design-system/components/switch", description: "Instant toggles" },
  { title: "Select", href: "/design-system/components/select", description: "Option menus" },
  { title: "Tabs", href: "/design-system/components/tabs", description: "Sectioned views" },
  { title: "Dialog", href: "/design-system/components/dialog", description: "Modal conversations" },
  { title: "Sheet", href: "/design-system/components/sheet", description: "Edge panels" },
  { title: "Dropdown", href: "/design-system/components/dropdown-menu", description: "Contextual menus" },
  { title: "Popover", href: "/design-system/components/popover", description: "Floating content" },
  { title: "Tooltip", href: "/design-system/components/tooltip", description: "Hover hints" },
  { title: "Avatar", href: "/design-system/components/avatar", description: "Identity marks" },
  { title: "Skeleton", href: "/design-system/components/skeleton", description: "Loading placeholders" },
  { title: "Empty state", href: "/design-system/components/empty-state", description: "Zero-data placeholder" },
  { title: "Separator", href: "/design-system/components/separator", description: "Visual dividers" },
  { title: "Breadcrumb", href: "/design-system/components/breadcrumb", description: "Path navigation" },
  { title: "Calendar", href: "/design-system/components/calendar", description: "Date picker" },
  { title: "Command", href: "/design-system/components/command", description: "Command palette" },
  { title: "Sidebar", href: "/design-system/components/sidebar", description: "App navigation" },
]

export const FOUNDATION_NAV: DesignSystemNavItem[] = [
  {
    title: "Colors",
    href: "/design-system/colors",
    description: "Semantic tokens for surfaces, text, and brand.",
  },
  {
    title: "Accents",
    href: "/design-system/accents",
    description: "Tailwind 200-shade chips for labels, events, and status.",
  },
  {
    title: "Typography",
    href: "/design-system/typography",
    description: "Inter Variable scale used across the product.",
  },
  {
    title: "Theme",
    href: "/design-system/theme",
    description: "Accent, gray, radius, type, scale, and color vision.",
  },
]

export const APP_NAV: DesignSystemNavItem[] = [
  { title: "Shell", href: "/design-system/shell", description: "Sidebar, command palette, user menu" },
  { title: "Mail", href: "/design-system/mail", description: "List rows, labels, send status" },
  { title: "Calendar", href: "/design-system/calendar", description: "Month cells and event chips" },
  { title: "Contacts", href: "/design-system/contacts", description: "List rows and avatars" },
  { title: "Files", href: "/design-system/files", description: "Folder and file cards" },
  { title: "Auth", href: "/design-system/auth", description: "Sign-in card" },
]

export const DESIGN_SYSTEM_NAV: DesignSystemNavGroup[] = [
  {
    title: "Get started",
    items: [
      {
        title: "Introduction",
        href: "/design-system",
        description: "Foundations and the components behind Workspace.",
      },
    ],
  },
  { title: "Foundations", items: FOUNDATION_NAV },
  { title: "Primitives", items: PRIMITIVE_NAV },
  { title: "App", items: APP_NAV },
]
