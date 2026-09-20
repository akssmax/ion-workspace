import { cn } from "cn"

/** A labelled, bordered group for settings pages with several related controls. */
export function SettingsGroup({
  title,
  children,
  className,
  contentClassName,
}: {
  title: string
  children: React.ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <section className={cn("space-y-3", className)} aria-label={title}>
      <h3 className="px-1 text-base font-semibold">{title}</h3>
      <div
        className={cn(
          "rounded-xl border bg-card px-4 sm:px-5",
          contentClassName
        )}
      >
        {children}
      </div>
    </section>
  )
}
