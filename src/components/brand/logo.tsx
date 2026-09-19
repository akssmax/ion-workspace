import { cn } from "cn"

interface IonLogoProps {
  className?: string
  markClassName?: string
  wordmark?: boolean
  size?: number
}

/** Nucleus + open orbit. Reads as a charged particle — and as a compact “i”. */
export function IonLogo({
  className,
  markClassName,
  wordmark = true,
  size = 28,
}: IonLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        className={cn("shrink-0", markClassName)}
      >
        <circle cx="16" cy="16" r="4.25" fill="currentColor" />
        <path
          d="M7 16a9 9 0 1 0 9-9"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
      {wordmark ? (
        <span className="text-[1.05em] font-semibold tracking-tight">ion</span>
      ) : (
        <span className="sr-only">Ion</span>
      )}
    </span>
  )
}
