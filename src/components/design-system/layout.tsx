import { useEffect, useState } from "react"
import { Link, Outlet, useRouterState } from "@tanstack/react-router"
import { Menu } from "lucide-react"
import { cn } from "cn"
import { DESIGN_SYSTEM_NAV } from "@/content/design-system-nav"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeMenu } from "@/components/theme/theme-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

export function DesignSystemLayout() {
  return (
    <TooltipProvider>
      <div className="min-h-svh bg-background text-foreground">
        <DocsChrome />
        <div className="flex">
          <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-64 shrink-0 border-r md:block">
            <ScrollArea className="h-full">
              <DocsSidebar />
            </ScrollArea>
          </aside>
          <div className="min-w-0 flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

function DocsChrome() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md">
      <MobileNav />
      <Link
        to="/design-system"
        activeOptions={{ exact: true }}
        className="flex items-center gap-2"
      >
        <span className="flex size-6 items-center justify-center rounded-md bg-sidebar-primary text-[11px] font-semibold text-sidebar-primary-foreground">
          W
        </span>
        <span className="text-sm font-medium">Design System</span>
      </Link>
      <span className="hidden text-sm text-muted-foreground sm:inline">
        Workspace
      </span>
      <div className="ml-auto">
        <ThemeMenu />
      </div>
    </header>
  )
}

function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Open navigation"
          />
        }
      >
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle>Design System</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100svh-5rem)]">
          <DocsSidebar />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function DocsSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav className="flex flex-col gap-6 px-4 py-6">
      {DESIGN_SYSTEM_NAV.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
            {group.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active =
                item.href === "/design-system"
                  ? pathname === "/design-system" || pathname === "/design-system/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <li key={item.href}>
                  <Link
                    to={item.href as never}
                    activeOptions={{ exact: true }}
                    data-active={active || undefined}
                    className={cn(
                      "block rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      active && "bg-muted font-medium text-foreground"
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
      <Separator />
      <Link
        to="/"
        className="px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        Back to app
      </Link>
    </nav>
  )
}
