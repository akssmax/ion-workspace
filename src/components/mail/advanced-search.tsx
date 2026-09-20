import { useState } from "react"
import { SlidersHorizontal, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useMailTemplates } from "@/queries/mail-templates"
import {
  useSavedMailSearches,
  useSaveMailSearch,
  useDeleteMailSearch,
} from "@/queries/mail-searches"

export function AdvancedSearch({
  onSearch,
}: {
  onSearch: (query: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [contains, setContains] = useState("")
  const [excludes, setExcludes] = useState("")
  const [after, setAfter] = useState("")
  const [before, setBefore] = useState("")
  const [minSize, setMinSize] = useState("")
  const [attachments, setAttachments] = useState(false)
  const [unread, setUnread] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { available } = useMailTemplates()
  const saved = useSavedMailSearches(available)
  const save = useSaveMailSearch()
  const remove = useDeleteMailSearch()

  function queryText() {
    const field = (name: string, value: string) => {
      const clean = value.trim().replaceAll('"', "")
      return clean
        ? `${name}:${clean.includes(" ") ? `"${clean}"` : clean}`
        : ""
    }
    const words = [
      field("from", from),
      field("to", to),
      field("subject", subject),
      contains.trim() && `"${contains.trim().replaceAll('"', "")}"`,
      excludes.trim() && `-${excludes.trim().replaceAll(/\s+/g, " -")}`,
      after && `after:${after}`,
      before && `before:${before}`,
      minSize && `larger:${minSize}`,
      attachments && "has:attachment",
      unread && "is:unread",
    ]
    return words.filter(Boolean).join(" ")
  }

  const fields = [
    { label: "From", value: from, set: setFrom },
    { label: "To", value: to, set: setTo },
    { label: "Subject", value: subject, set: setSubject },
    { label: "Contains", value: contains, set: setContains },
    { label: "Doesn't contain", value: excludes, set: setExcludes },
  ]

  return (
    <>
      <Tooltip><TooltipTrigger render={<Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-7 shrink-0"
        aria-label="Advanced mail search"
        onClick={() => setOpen(true)}
      />}>
        <SlidersHorizontal className="size-4" />
      </TooltipTrigger><TooltipContent>Advanced search</TooltipContent></Tooltip>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Advanced mail search</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {fields.map((field) => (
              <div key={field.label} className="col-span-2 grid gap-1">
                <Label htmlFor={`search-${field.label}`}>{field.label}</Label>
                <Input
                  id={`search-${field.label}`}
                  value={field.value}
                  onChange={(event) => field.set(event.target.value)}
                />
              </div>
            ))}
            <div className="grid gap-1">
              <Label htmlFor="search-after">After</Label>
              <DatePicker id="search-after" value={after} onChange={setAfter} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="search-before">Before</Label>
              <DatePicker
                id="search-before"
                value={before}
                onChange={setBefore}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="search-size">Minimum size (bytes)</Label>
              <Input
                id="search-size"
                type="number"
                min="0"
                value={minSize}
                onChange={(event) => setMinSize(event.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={attachments}
                onCheckedChange={(value) => setAttachments(value === true)}
              />{" "}
              Has attachment
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={unread}
                onCheckedChange={(value) => setUnread(value === true)}
              />{" "}
              Unread
            </label>
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <Button
              disabled={!queryText()}
              onClick={() => {
                onSearch(queryText())
                setOpen(false)
              }}
            >
              Search
            </Button>
            {available ? (
              <Button
                variant="outline"
                disabled={!queryText()}
                onClick={async () => {
                  const name = window.prompt("Saved search name")?.trim()
                  if (!name) return
                  try {
                    await save.mutateAsync({ name, query: queryText() })
                    setError(null)
                  } catch (cause) {
                    setError(
                      cause instanceof Error
                        ? cause.message
                        : "Could not save search."
                    )
                  }
                }}
              >
                Save search
              </Button>
            ) : null}
          </div>
          {available && saved.data?.length ? (
            <div className="border-t pt-3">
              <h3 className="mb-2 text-sm font-medium">Saved searches</h3>
              {saved.data.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <button
                    className="min-w-0 flex-1 truncate py-1 text-left text-sm hover:underline"
                    onClick={() => {
                      onSearch(item.query)
                      setOpen(false)
                    }}
                  >
                    {item.name}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${item.name}`}
                    onClick={() => void remove.mutateAsync(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
