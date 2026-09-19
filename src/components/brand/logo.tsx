import { cn } from "cn"
import { useReducedMotion } from "framer-motion"
import * as m from "framer-motion/m"

interface IonLogoProps {
  className?: string
  markClassName?: string
  wordmark?: boolean
  size?: number
  animateOnHover?: boolean
}

function MarkPaths() {
  return (
    <>
      <circle cx="16" cy="16" r="4.25" fill="currentColor" />
      <path
        d="M7 16a9 9 0 1 0 9-9"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </>
  )
}

/** Nucleus + open orbit. Reads as a charged particle — and as a compact “i”. */
export function IonLogo({
  className,
  markClassName,
  wordmark = true,
  size = 28,
  animateOnHover = false,
}: IonLogoProps) {
  const reduceMotion = useReducedMotion()
  const rootClassName = cn(
    "inline-flex items-center gap-[0.16em] align-middle",
    className
  )
  const markProps = {
    width: size,
    height: size,
    viewBox: "5 5 22 22",
    fill: "none",
    "aria-hidden": true as const,
    className: cn("shrink-0", markClassName),
  }
  const label = wordmark ? (
    <span className="block text-[1.05em] leading-none font-semibold tracking-tight">
      ion
    </span>
  ) : (
    <span className="sr-only">Ion</span>
  )

  if (animateOnHover && !reduceMotion) {
    return (
      <m.span
        className={rootClassName}
        initial="rest"
        animate="rest"
        whileHover="hover"
      >
        <m.svg
          {...markProps}
          variants={{
            rest: { rotate: 0 },
            hover: {
              rotate: 360,
              transition: { duration: 0.7, ease: "easeInOut" },
            },
          }}
          style={{ transformOrigin: "center" }}
        >
          <MarkPaths />
        </m.svg>
        {label}
      </m.span>
    )
  }

  return (
    <span className={rootClassName}>
      <svg {...markProps}>
        <MarkPaths />
      </svg>
      {label}
    </span>
  )
}
