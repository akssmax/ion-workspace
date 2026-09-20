import { useState } from "react"
import { ArrowDownUp, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { MAIL_QUICK_FILTERS, MAIL_SORT_OPTIONS, mailSortComparators, type MailQuickFilter, type MailSort } from "@/lib/mail-list"
import { useMailSortCapabilities } from "@/queries/mail"

export function MailListControls({ sort, onSortChange, quickFilters, onQuickFiltersChange, sent }: {
  sort: MailSort
  onSortChange: (sort: MailSort) => void
  quickFilters: MailQuickFilter[]
  onQuickFiltersChange: (filters: MailQuickFilter[]) => void
  sent: boolean
}) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const capabilities = useMailSortCapabilities()
  const available = capabilities.data ?? ["receivedAt"]
  function toggle(value: MailQuickFilter) {
    onQuickFiltersChange(quickFilters.includes(value) ? quickFilters.filter(item => item !== value) : [...quickFilters, value])
  }

  return <div className="flex min-h-10 shrink-0 items-center gap-1.5 overflow-x-auto border-b px-2 py-1">
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="min-h-9 shrink-0 gap-1.5" aria-label="Sort messages" />}>
        <ArrowDownUp className="size-3.5" /><span className="hidden sm:inline">Sort:</span> {MAIL_SORT_OPTIONS.find(option => option.value === sort)?.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-52">
        <DropdownMenuRadioGroup value={sort} onValueChange={value => onSortChange(value as MailSort)}>
          {MAIL_SORT_OPTIONS.map(option => {
            const supported = mailSortComparators(option.value, sent, available).every(cmp => available.includes(cmp.property))
            return <DropdownMenuRadioItem key={option.value} value={option.value} disabled={!supported} aria-label={supported ? option.label : `${option.label}: unsupported by mail server`}>
              {option.label}{!supported ? <span className="ms-auto text-xs text-muted-foreground">Unavailable</span> : null}
            </DropdownMenuRadioItem>
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>

    <div className="hidden items-center gap-1 sm:flex">
      {MAIL_QUICK_FILTERS.map(option => <Button key={option.value} size="sm" variant={quickFilters.includes(option.value) ? "secondary" : "ghost"} aria-pressed={quickFilters.includes(option.value)} onClick={() => toggle(option.value)}>{option.label}</Button>)}
    </div>
    <Button variant="outline" size="sm" className="min-h-9 shrink-0 sm:hidden" aria-label={`Filter messages${quickFilters.length ? `, ${quickFilters.length} active` : ""}`} onClick={() => setSheetOpen(true)}>
      <Filter className="size-4" /> Filters {quickFilters.length ? <Badge variant="secondary">{quickFilters.length}</Badge> : null}
    </Button>
    {quickFilters.length > 0 ? <Button variant="ghost" size="sm" className="ms-auto shrink-0" onClick={() => onQuickFiltersChange([])}><X className="size-3.5" /> Clear filters</Button> : null}
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetContent side="bottom" className="max-h-[80svh] rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]">
        <SheetHeader><SheetTitle>Filter messages</SheetTitle></SheetHeader>
        <div className="space-y-1 px-6 pb-6">
          {MAIL_QUICK_FILTERS.map(option => <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <Checkbox checked={quickFilters.includes(option.value)} onCheckedChange={() => toggle(option.value)} />{option.label}
          </label>)}
          {quickFilters.length ? <Button variant="outline" onClick={() => onQuickFiltersChange([])}>Clear filters</Button> : null}
        </div>
      </SheetContent>
    </Sheet>
  </div>
}
