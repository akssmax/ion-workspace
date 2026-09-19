import { LazyMotion, MotionConfig, useReducedMotion } from "framer-motion"
import * as m from "framer-motion/m"
import type { ReactNode } from "react"

const loadFeatures = () =>
  import("./motion-features").then((module) => module.default)

export function LandingMotion({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadFeatures} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  )
}

/** Content remains visible in SSR and when JS/animation features aren't loaded. */
export function Reveal({
  children,
  className,
  delay = 0,
  disabled = false,
}: {
  children: ReactNode
  className?: string
  delay?: number
  disabled?: boolean
}) {
  const reduce = useReducedMotion()
  return (
    <m.div
      className={className}
      initial={false}
      whileInView={
        reduce || disabled ? undefined : { opacity: [0.65, 1], y: [18, 0] }
      }
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  )
}

export function HoverLift({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <m.div
      className={className}
      whileHover={reduce ? undefined : { y: -4 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </m.div>
  )
}

export function PreviewTransition({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <m.div
      initial={reduce ? false : { opacity: 0.65, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </m.div>
  )
}

export function ProtocolDiagram() {
  const reduce = useReducedMotion()
  return (
    <div
      className="ion-network"
      role="img"
      aria-label="JMAP server connects through JMAP to mail, calendar, contacts, and files in Ion"
    >
      <svg viewBox="0 0 440 260" aria-hidden="true">
        <defs>
          <pattern
            id="network-dots"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r=".6" fill="currentColor" opacity=".25" />
          </pattern>
        </defs>
        <rect width="440" height="260" fill="url(#network-dots)" />
        {[
          "M100 130 H220 V40 H330",
          "M100 130 H220 V100 H330",
          "M100 130 H220 V160 H330",
          "M100 130 H220 V220 H330",
        ].map((d, i) => (
          <m.path
            key={d}
            d={d}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            initial={false}
            whileInView={
              reduce ? undefined : { pathLength: [0, 1], opacity: [0.15, 0.65] }
            }
            viewport={{ once: true }}
            transition={{ duration: 1, delay: i * 0.12 }}
          />
        ))}
        <rect
          x="25"
          y="103"
          width="100"
          height="54"
          rx="5"
          fill="#222222"
          stroke="#777777"
        />
        <text x="75" y="135" textAnchor="middle" fill="#f5f5f5" fontSize="12">
          JMAP server
        </text>
        <rect x="168" y="113" width="70" height="34" rx="17" fill="#eeeeee" />
        <text x="203" y="134" textAnchor="middle" fill="#222222" fontSize="11">
          JMAP
        </text>
        {["Mail", "Calendar", "Contacts", "Files"].map((label, i) => (
          <g key={label}>
            <rect
              x="315"
              y={20 + i * 60}
              width="100"
              height="40"
              rx="4"
              fill="#222222"
              stroke="#777777"
            />
            <text
              x="365"
              y={45 + i * 60}
              textAnchor="middle"
              fill="#f5f5f5"
              fontSize="11"
            >
              {label}
            </text>
          </g>
        ))}
      </svg>
      <span>ONE CONNECTION. FOUR WAYS TO WORK.</span>
    </div>
  )
}
