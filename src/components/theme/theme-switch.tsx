import { Monitor, Moon, Sun } from "lucide-react"
import { cn } from "cn"
import { useTheme, type Theme } from "./theme-provider"

const OPTIONS: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
]

export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        "inline-flex max-w-full flex-wrap rounded-full border border-border bg-background p-0.5",
        className
      )}
    >
      {OPTIONS.map((option) => {
        const selected = theme === option.id
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(option.id)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors",
              selected
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <option.icon className="size-3" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
