import { Loader2 } from "lucide-react"
import { cn } from "cn"

function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof Loader2>) {
  return (
    <Loader2
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-4 shrink-0 animate-spin text-primary", className)}
      {...props}
    />
  )
}

export { Spinner }
