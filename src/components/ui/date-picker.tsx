import { useState } from "react"
import { format, parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function DatePicker({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISO(value) : undefined

  function selectDate(date: Date | undefined) {
    onChange(date ? format(date, "yyyy-MM-dd") : "")
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="ghost"
            className="w-full min-w-0 justify-between bg-input/50 font-normal"
          />
        }
      >
        <span className={selected ? "truncate" : "text-muted-foreground"}>
          {selected ? format(selected, "dd/MM/yyyy") : "dd/mm/yyyy"}
        </span>
        <CalendarIcon className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto gap-0 overflow-hidden p-0"
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={selectDate}
          captionLayout="label"
          autoFocus
        />
        <div className="flex items-center justify-between border-t p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!value}
            onClick={() => selectDate(undefined)}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => selectDate(new Date())}
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
