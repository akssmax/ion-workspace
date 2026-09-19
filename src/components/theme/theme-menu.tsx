import { Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeController } from "./theme-controller"

export function ThemeMenu() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Theme"
            title="Theme"
          />
        }
      >
        <Palette className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[22.5rem] gap-0 p-0 sm:w-[24rem]"
      >
        <PopoverHeader className="border-b px-4 py-3">
          <PopoverTitle>Theme</PopoverTitle>
        </PopoverHeader>
        <ScrollArea className="h-[min(36rem,70vh)]">
          <div className="p-4">
            <ThemeController variant="compact" />
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
