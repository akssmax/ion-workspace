/**
 * EmptyState — a rich, props-driven zero-data placeholder.
 *
 * States are semantic: neutral (empty), info, success, warning (e.g. partial
 * results), danger (error) and a dedicated "no results" search tone. The icon
 * sits in a centered glass container with a tone-tinted glow ring, optionally
 * over a copy of the sign-in backdrop.
 */

import type { ReactNode } from "react"
import { cn } from "cn"
import { AuthBackground } from "@/components/effects/AuthBackground"

export type EmptyStateSize = "sm" | "md" | "lg"
export type EmptyStateTone =
  "neutral" | "noResults" | "info" | "success" | "warning" | "danger"

export interface EmptyStateProps {
  /** Icon element rendered centered inside the framed container. */
  icon?: ReactNode
  /** Short, primary line. */
  title?: ReactNode
  /** Supporting copy. */
  description?: ReactNode
  /** Primary call to action (e.g. a Button). */
  action?: ReactNode
  /** Extra content below the action. */
  children?: ReactNode
  /** Visual scale. */
  size?: EmptyStateSize
  /**
   * Semantic tone — drives the icon and glow colors. Use `noResults` for empty
   * search/filter results, `warning` for partial failures, `danger` for errors.
   */
  tone?: EmptyStateTone
  /**
   * Render the animated backdrop behind the empty state. It is dark-only and
   * theme aware: in light theme the empty state falls back to the card surface
   * tokens. Default `true`.
   */
  background?: boolean
  className?: string
  iconContainerClassName?: string
}

const SIZES: Record<
  EmptyStateSize,
  { root: string; icon: string; iconSize: string; title: string }
> = {
  sm: {
    root: "gap-3 p-6 min-h-40",
    icon: "size-12 rounded-2xl",
    iconSize: "size-5",
    title: "text-sm",
  },
  md: {
    root: "gap-4 p-8 min-h-56",
    icon: "size-16 rounded-2xl",
    iconSize: "size-7",
    title: "text-base",
  },
  lg: {
    root: "gap-5 p-10 min-h-80",
    icon: "size-20 rounded-3xl",
    iconSize: "size-9",
    title: "text-lg",
  },
}

const TONES: Record<
  EmptyStateTone,
  { glow: string; icon: string; iconLight: string; border: string }
> = {
  neutral: {
    glow: "from-primary/40 via-primary/5 to-transparent",
    icon: "dark:text-white/90",
    iconLight: "text-primary",
    border: "dark:border-white/15",
  },
  noResults: {
    glow: "from-violet-400/45 via-violet-400/5 to-transparent",
    icon: "dark:text-violet-200",
    iconLight: "text-violet-600",
    border: "dark:border-violet-300/25",
  },
  info: {
    glow: "from-sky-400/50 via-sky-400/5 to-transparent",
    icon: "dark:text-sky-200",
    iconLight: "text-sky-600",
    border: "dark:border-sky-300/25",
  },
  success: {
    glow: "from-emerald-400/50 via-emerald-400/5 to-transparent",
    icon: "dark:text-emerald-200",
    iconLight: "text-emerald-600",
    border: "dark:border-emerald-300/25",
  },
  warning: {
    glow: "from-amber-400/55 via-amber-400/5 to-transparent",
    icon: "dark:text-amber-200",
    iconLight: "text-amber-600",
    border: "dark:border-amber-300/30",
  },
  danger: {
    glow: "from-red-500/55 via-red-500/5 to-transparent",
    icon: "dark:text-red-200",
    iconLight: "text-destructive",
    border: "dark:border-red-400/30",
  },
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  children,
  size = "md",
  tone = "neutral",
  background = true,
  className,
  iconContainerClassName,
}: EmptyStateProps) {
  const scale = SIZES[size]
  const palette = TONES[tone]
  return (
    <div
      role="status"
      className={cn(
        "relative isolate flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl border text-center",
        scale.root,
        background
          ? cn(
              "border-border bg-card text-foreground dark:bg-transparent dark:text-white",
              palette.border
            )
          : "border-border bg-card text-foreground",
        className
      )}
    >
      {background ? (
        <div className="absolute inset-0 hidden dark:block">
          <AuthBackground />
          {/* Keep the copy legible over the animated pattern. */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--background)_80%,transparent)_0%,color-mix(in_oklch,var(--background)_67%,transparent)_55%,color-mix(in_oklch,var(--background)_60%,transparent)_100%)]" />
        </div>
      ) : null}

      <div className="relative z-10 flex flex-col items-center gap-4">
        {icon ? (
          <span
            className={cn(
              "relative grid shrink-0 place-items-center border shadow-lg",
              scale.icon,
              background
                ? cn(
                    "border-border bg-muted dark:bg-white/[0.06] dark:shadow-black/40 dark:backdrop-blur-md",
                    palette.border
                  )
                : "border-border bg-muted",
              iconContainerClassName
            )}
          >
            {/* Top sheen for a glassy finish. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-transparent to-transparent dark:from-white/15"
            />
            {/* Tone-tinted glow ring. */}
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute -inset-px rounded-[inherit] bg-gradient-to-b opacity-70 blur-[2px]",
                palette.glow
              )}
            />
            <span
              className={cn(
                "relative grid place-items-center [&>svg]:size-full",
                scale.iconSize,
                background
                  ? cn(palette.iconLight, palette.icon)
                  : palette.iconLight
              )}
            >
              {icon}
            </span>
          </span>
        ) : null}

        {title ? (
          <p className={cn("font-semibold tracking-tight", scale.title)}>
            {title}
          </p>
        ) : null}
        {description ? (
          <p
            className={cn(
              "max-w-md text-sm text-balance",
              background
                ? "text-muted-foreground dark:text-white/60"
                : "text-muted-foreground",
              title ? "-mt-1" : ""
            )}
          >
            {description}
          </p>
        ) : null}
        {action ? <div className="mt-1">{action}</div> : null}
        {children}
      </div>
    </div>
  )
}
