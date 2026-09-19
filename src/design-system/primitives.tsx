import { Inbox, Mail, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
} from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Calendar } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Playground, type PlaygroundValues } from "@/components/design-system/playground"
import { DocsSection } from "@/components/design-system/page"

export type PrimitiveDoc = {
  slug: string
  title: string
  description: string
  file: string
  Page: () => React.ReactNode
}

function str(values: PlaygroundValues, key: string) {
  return String(values[key] ?? "")
}

function bool(values: PlaygroundValues, key: string) {
  return Boolean(values[key])
}

export const PRIMITIVES: PrimitiveDoc[] = [
  {
    slug: "button",
    title: "Button",
    description: "Trigger an action. Variants cover primary, secondary, ghost, and destructive work.",
    file: "src/components/ui/button.tsx",
    Page: function ButtonPage() {
      return (
        <>
          <Playground
            title="Interactive"
            controls={[
              {
                type: "select",
                name: "variant",
                options: [
                  "default",
                  "outline",
                  "secondary",
                  "ghost",
                  "destructive",
                  "link",
                ],
                defaultValue: "default",
              },
              {
                type: "select",
                name: "size",
                options: ["xs", "sm", "default", "lg"],
                defaultValue: "default",
              },
              { type: "boolean", name: "disabled", defaultValue: false },
              { type: "text", name: "children", label: "label", defaultValue: "Send" },
            ]}
            render={(v) => (
              <Button
                variant={str(v, "variant") as never}
                size={str(v, "size") as never}
                disabled={bool(v, "disabled")}
              >
                {str(v, "children")}
              </Button>
            )}
            code={(v) =>
              `<Button variant="${str(v, "variant")}" size="${str(v, "size")}"${bool(v, "disabled") ? " disabled" : ""}>\n  ${str(v, "children")}\n</Button>`
            }
          />
          <DocsSection title="Sizes">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="xs">Extra small</Button>
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </DocsSection>
        </>
      )
    },
  },
  {
    slug: "badge",
    title: "Badge",
    description: "Compact labels for counts, status, and metadata.",
    file: "src/components/ui/badge.tsx",
    Page: function BadgePage() {
      return (
        <Playground
          title="Interactive"
          controls={[
            {
              type: "select",
              name: "variant",
              options: [
                "default",
                "secondary",
                "destructive",
                "outline",
                "ghost",
                "link",
              ],
              defaultValue: "default",
            },
            { type: "text", name: "children", label: "label", defaultValue: "Inbox" },
          ]}
          render={(v) => (
            <Badge variant={str(v, "variant") as never}>{str(v, "children")}</Badge>
          )}
          code={(v) =>
            `<Badge variant="${str(v, "variant")}">${str(v, "children")}</Badge>`
          }
        />
      )
    },
  },
  {
    slug: "input",
    title: "Input",
    description: "Single-line text field used in search, compose, and settings.",
    file: "src/components/ui/input.tsx",
    Page: function InputPage() {
      return (
        <Playground
          title="Interactive"
          canvasClassName="w-full"
          controls={[
            { type: "text", name: "placeholder", defaultValue: "Search mail…" },
            { type: "boolean", name: "disabled", defaultValue: false },
          ]}
          render={(v) => (
            <Input
              placeholder={str(v, "placeholder")}
              disabled={bool(v, "disabled")}
              className="max-w-sm"
            />
          )}
          code={(v) =>
            `<Input placeholder="${str(v, "placeholder")}"${bool(v, "disabled") ? " disabled" : ""} />`
          }
        />
      )
    },
  },
  {
    slug: "textarea",
    title: "Textarea",
    description: "Multiline field for notes and longer copy.",
    file: "src/components/ui/textarea.tsx",
    Page: function TextareaPage() {
      return (
        <Playground
          title="Interactive"
          canvasClassName="w-full"
          controls={[
            {
              type: "text",
              name: "placeholder",
              defaultValue: "Add a note…",
            },
            { type: "boolean", name: "disabled", defaultValue: false },
          ]}
          render={(v) => (
            <Textarea
              placeholder={str(v, "placeholder")}
              disabled={bool(v, "disabled")}
              className="max-w-sm"
            />
          )}
          code={(v) =>
            `<Textarea placeholder="${str(v, "placeholder")}"${bool(v, "disabled") ? " disabled" : ""} />`
          }
        />
      )
    },
  },
  {
    slug: "label",
    title: "Label",
    description: "Caption for a form control.",
    file: "src/components/ui/label.tsx",
    Page: function LabelPage() {
      return (
        <Playground
          title="With input"
          render={() => (
            <div className="w-64 space-y-2">
              <Label htmlFor="ds-subject">Subject</Label>
              <Input id="ds-subject" placeholder="Meeting notes" />
            </div>
          )}
          code={() =>
            `<Label htmlFor="subject">Subject</Label>\n<Input id="subject" placeholder="Meeting notes" />`
          }
        />
      )
    },
  },
  {
    slug: "checkbox",
    title: "Checkbox",
    description: "Binary choice used in bulk select and settings.",
    file: "src/components/ui/checkbox.tsx",
    Page: function CheckboxPage() {
      return (
        <Playground
          title="Interactive"
          controls={[{ type: "boolean", name: "disabled", defaultValue: false }]}
          render={(v) => (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox disabled={bool(v, "disabled")} defaultChecked />
              Select all
            </label>
          )}
          code={(v) =>
            `<Checkbox${bool(v, "disabled") ? " disabled" : ""} defaultChecked />`
          }
        />
      )
    },
  },
  {
    slug: "switch",
    title: "Switch",
    description: "Immediate on/off control for feature flags and settings.",
    file: "src/components/ui/switch.tsx",
    Page: function SwitchPage() {
      return (
        <Playground
          title="Interactive"
          controls={[
            { type: "select", name: "size", options: ["sm", "default"], defaultValue: "default" },
            { type: "boolean", name: "disabled", defaultValue: false },
          ]}
          render={(v) => (
            <Switch
              size={str(v, "size") as "sm" | "default"}
              disabled={bool(v, "disabled")}
              defaultChecked
            />
          )}
          code={(v) =>
            `<Switch size="${str(v, "size")}"${bool(v, "disabled") ? " disabled" : ""} defaultChecked />`
          }
        />
      )
    },
  },
  {
    slug: "select",
    title: "Select",
    description: "Choose one option from a list.",
    file: "src/components/ui/select.tsx",
    Page: function SelectPage() {
      return (
        <Playground
          title="Interactive"
          render={() => (
            <Select defaultValue="comfortable">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comfortable">Comfortable</SelectItem>
                <SelectItem value="cozy">Cozy</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          )}
          code={() =>
            `<Select defaultValue="comfortable">\n  <SelectTrigger><SelectValue /></SelectTrigger>\n  <SelectContent>\n    <SelectItem value="comfortable">Comfortable</SelectItem>\n    <SelectItem value="cozy">Cozy</SelectItem>\n    <SelectItem value="compact">Compact</SelectItem>\n  </SelectContent>\n</Select>`
          }
        />
      )
    },
  },
  {
    slug: "tabs",
    title: "Tabs",
    description: "Switch between related views. Used in inbox settings and this docs site.",
    file: "src/components/ui/tabs.tsx",
    Page: function TabsPage() {
      return (
        <Playground
          title="Interactive"
          controls={[
            {
              type: "select",
              name: "variant",
              options: ["default", "line"],
              defaultValue: "default",
            },
          ]}
          render={(v) => (
            <Tabs defaultValue="layout">
              <TabsList variant={str(v, "variant") as "default" | "line"}>
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
              </TabsList>
              <TabsContent value="layout">Reading pane and density.</TabsContent>
              <TabsContent value="features">Feature flags.</TabsContent>
            </Tabs>
          )}
          code={(v) =>
            `<Tabs defaultValue="layout">\n  <TabsList variant="${str(v, "variant")}">…</TabsList>\n</Tabs>`
          }
        />
      )
    },
  },
  {
    slug: "dialog",
    title: "Dialog",
    description: "Modal conversation for compose, confirmations, and settings.",
    file: "src/components/ui/dialog.tsx",
    Page: function DialogPage() {
      return (
        <Playground
          title="Interactive"
          render={() => (
            <Dialog>
              <DialogTrigger render={<Button variant="outline" />}>
                Open dialog
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Inbox settings</DialogTitle>
                  <DialogDescription>
                    Change density, snippets, and the reading pane.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          code={() =>
            `<Dialog>\n  <DialogTrigger render={<Button variant="outline" />}>Open dialog</DialogTrigger>\n  <DialogContent>\n    <DialogHeader>\n      <DialogTitle>Inbox settings</DialogTitle>\n      <DialogDescription>Change density, snippets, and the reading pane.</DialogDescription>\n    </DialogHeader>\n  </DialogContent>\n</Dialog>`
          }
        />
      )
    },
  },
  {
    slug: "sheet",
    title: "Sheet",
    description: "Panel that slides in from an edge. Used for mobile navigation.",
    file: "src/components/ui/sheet.tsx",
    Page: function SheetPage() {
      return (
        <Playground
          title="Interactive"
          render={() => (
            <Sheet>
              <SheetTrigger render={<Button variant="outline" />}>
                Open sheet
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                  <SheetDescription>Jump to a mailbox or app.</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          )}
          code={() =>
            `<Sheet>\n  <SheetTrigger render={<Button variant="outline" />}>Open sheet</SheetTrigger>\n  <SheetContent>\n    <SheetHeader>\n      <SheetTitle>Navigation</SheetTitle>\n    </SheetHeader>\n  </SheetContent>\n</Sheet>`
          }
        />
      )
    },
  },
  {
    slug: "dropdown-menu",
    title: "Dropdown",
    description: "Contextual actions for labels, move-to, and the user menu.",
    file: "src/components/ui/dropdown-menu.tsx",
    Page: function DropdownPage() {
      return (
        <Playground
          title="Interactive"
          render={() => (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" />}>
                Label as
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Labels</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Work</DropdownMenuItem>
                <DropdownMenuItem>Personal</DropdownMenuItem>
                <DropdownMenuItem>Later</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          code={() =>
            `<DropdownMenu>\n  <DropdownMenuTrigger render={<Button variant="outline" />}>Label as</DropdownMenuTrigger>\n  <DropdownMenuContent>\n    <DropdownMenuItem>Work</DropdownMenuItem>\n  </DropdownMenuContent>\n</DropdownMenu>`
          }
        />
      )
    },
  },
  {
    slug: "popover",
    title: "Popover",
    description: "Floating panel anchored to a trigger.",
    file: "src/components/ui/popover.tsx",
    Page: function PopoverPage() {
      return (
        <Playground
          title="Interactive"
          render={() => (
            <Popover>
              <PopoverTrigger render={<Button variant="outline" />}>
                Details
              </PopoverTrigger>
              <PopoverContent>
                <PopoverHeader>
                  <PopoverTitle>Q3 launch</PopoverTitle>
                  <PopoverDescription>Thursday 10:00 · Work</PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>
          )}
          code={() =>
            `<Popover>\n  <PopoverTrigger render={<Button variant="outline" />}>Details</PopoverTrigger>\n  <PopoverContent>…</PopoverContent>\n</Popover>`
          }
        />
      )
    },
  },
  {
    slug: "tooltip",
    title: "Tooltip",
    description: "Short hint on hover or focus. Used on icon-only toolbar buttons.",
    file: "src/components/ui/tooltip.tsx",
    Page: function TooltipPage() {
      return (
        <Playground
          title="Interactive"
          render={() => (
            <Tooltip>
              <TooltipTrigger render={<Button variant="ghost" size="icon" />}>
                <Star className="size-4" />
              </TooltipTrigger>
              <TooltipContent>Star</TooltipContent>
            </Tooltip>
          )}
          code={() =>
            `<Tooltip>\n  <TooltipTrigger render={<Button variant="ghost" size="icon" />}>\n    <Star />\n  </TooltipTrigger>\n  <TooltipContent>Star</TooltipContent>\n</Tooltip>`
          }
        />
      )
    },
  },
  {
    slug: "avatar",
    title: "Avatar",
    description: "Identity mark in the sidebar footer and contact list.",
    file: "src/components/ui/avatar.tsx",
    Page: function AvatarPage() {
      return (
        <Playground
          title="Interactive"
          controls={[
            {
              type: "select",
              name: "size",
              options: ["sm", "default", "lg"],
              defaultValue: "default",
            },
          ]}
          render={(v) => (
            <AvatarGroup>
              <Avatar size={str(v, "size") as never}>
                <AvatarFallback>YS</AvatarFallback>
              </Avatar>
              <Avatar size={str(v, "size") as never}>
                <AvatarFallback>SR</AvatarFallback>
              </Avatar>
            </AvatarGroup>
          )}
          code={(v) =>
            `<Avatar size="${str(v, "size")}">\n  <AvatarFallback>YS</AvatarFallback>\n</Avatar>`
          }
        />
      )
    },
  },
  {
    slug: "skeleton",
    title: "Skeleton",
    description: "Placeholder shown while mail, contacts, or files load.",
    file: "src/components/ui/skeleton.tsx",
    Page: function SkeletonPage() {
      return (
        <Playground
          title="List placeholders"
          canvasClassName="w-full"
          render={() => (
            <div className="w-full max-w-sm space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-3/4" />
            </div>
          )}
          code={() => `<Skeleton className="h-12 w-full" />`}
        />
      )
    },
  },
  {
    slug: "separator",
    title: "Separator",
    description: "Hairline divider between groups.",
    file: "src/components/ui/separator.tsx",
    Page: function SeparatorPage() {
      return (
        <Playground
          title="Horizontal"
          canvasClassName="w-full"
          render={() => (
            <div className="w-64 space-y-3 text-sm">
              <p>Inbox</p>
              <Separator />
              <p>Sent</p>
            </div>
          )}
          code={() => `<Separator />`}
        />
      )
    },
  },
  {
    slug: "breadcrumb",
    title: "Breadcrumb",
    description: "Path navigation. Files currently use a custom trail; this primitive is available.",
    file: "src/components/ui/breadcrumb.tsx",
    Page: function BreadcrumbDocsPage() {
      return (
        <Playground
          title="Path"
          render={() => (
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">My Files</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Documents</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>product-spec.md</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}
          code={() =>
            `<Breadcrumb>\n  <BreadcrumbList>\n    <BreadcrumbItem><BreadcrumbLink href="#">My Files</BreadcrumbLink></BreadcrumbItem>\n    <BreadcrumbSeparator />\n    <BreadcrumbItem><BreadcrumbPage>product-spec.md</BreadcrumbPage></BreadcrumbItem>\n  </BreadcrumbList>\n</Breadcrumb>`
          }
        />
      )
    },
  },
  {
    slug: "calendar",
    title: "Calendar",
    description: "Date picker primitive (react-day-picker). The month grid in the app is a custom view.",
    file: "src/components/ui/calendar.tsx",
    Page: function CalendarPage() {
      return (
        <Playground
          title="Date picker"
          render={() => <Calendar />}
          code={() => `<Calendar />`}
        />
      )
    },
  },
  {
    slug: "command",
    title: "Command",
    description: "Searchable command list used by Cmd/Ctrl+K.",
    file: "src/components/ui/command.tsx",
    Page: function CommandPage() {
      return (
        <Playground
          title="Palette"
          canvasClassName="w-full"
          render={() => (
            <Command className="max-w-md rounded-2xl border shadow-sm">
              <CommandInput placeholder="Type a command…" />
              <CommandList>
                <CommandEmpty>No results.</CommandEmpty>
                <CommandGroup heading="Mail">
                  <CommandItem>Compose</CommandItem>
                  <CommandItem>Go to Inbox</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          )}
          code={() =>
            `<Command>\n  <CommandInput placeholder="Type a command…" />\n  <CommandList>\n    <CommandGroup heading="Mail">\n      <CommandItem>Compose</CommandItem>\n    </CommandGroup>\n  </CommandList>\n</Command>`
          }
        />
      )
    },
  },
  {
    slug: "sidebar",
    title: "Sidebar",
    description: "App navigation shell. Workspace uses the nested icon-rail + panel pattern.",
    file: "src/components/ui/sidebar.tsx",
    Page: function SidebarPage() {
      return (
        <Playground
          title="Menu"
          canvasClassName="w-full p-0"
          render={() => (
            <SidebarProvider className="min-h-0 w-full max-w-xs">
              <Sidebar className="relative w-full" collapsible="none">
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Mail</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton isActive>
                            <Inbox />
                            Inbox
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton>
                            <Star />
                            Starred
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton>
                            <Mail />
                            Sent
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
            </SidebarProvider>
          )}
          code={() =>
            `<SidebarProvider>\n  <Sidebar>\n    <SidebarContent>\n      <SidebarMenu>\n        <SidebarMenuItem>\n          <SidebarMenuButton isActive>Inbox</SidebarMenuButton>\n        </SidebarMenuItem>\n      </SidebarMenu>\n    </SidebarContent>\n  </Sidebar>\n</SidebarProvider>`
          }
        />
      )
    },
  },
]

export function primitiveBySlug(slug: string) {
  return PRIMITIVES.find((p) => p.slug === slug)
}
