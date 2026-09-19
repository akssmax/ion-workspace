import type { ReactNode } from "react"
import { cn } from "cn"
import { LandingMotion, Reveal } from "./landing-motion"
import { LandingBackground } from "./landing-background"

export function LandingShell({ children }: { children: ReactNode }) {
  return (
    <LandingMotion>
      <div className="landing min-h-svh bg-background text-foreground">
        {children}
      </div>
    </LandingMotion>
  )
}

export function LandingRow({
  children,
  className,
  id,
  top = false,
  tone,
  atmosphere = false,
  tall = false,
}: {
  children: ReactNode
  className?: string
  id?: string
  top?: boolean
  tone?: string
  atmosphere?: boolean
  tall?: boolean
}) {
  return (
    <section id={id} className={cn("relative", tone, className)}>
      {atmosphere && (
        <LandingBackground inverted={tone?.includes("ion-inverse")} />
      )}
      <Reveal
        disabled={top || atmosphere}
        className={cn(
          "relative z-10 mx-auto grid max-w-6xl grid-cols-4 border-s border-border md:grid-cols-12",
          top && "border-t",
          tall && "min-h-[70svh]",
          atmosphere && "border-border/60"
        )}
      >
        {children}
      </Reveal>
    </section>
  )
}

const SPAN: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
}

const MD_SPAN: Record<number, string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  10: "md:col-span-10",
  11: "md:col-span-11",
  12: "md:col-span-12",
}

export function Cell({
  children,
  className,
  span = 4,
  md = 12,
}: {
  children?: ReactNode
  className?: string
  span?: keyof typeof SPAN
  md?: keyof typeof MD_SPAN
}) {
  return (
    <div
      className={cn(
        "min-w-0 border-e border-b border-border",
        SPAN[span],
        MD_SPAN[md],
        className
      )}
    >
      {children}
    </div>
  )
}
