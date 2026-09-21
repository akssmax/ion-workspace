import { ClientOnly } from "@tanstack/react-router"
import FaultyTerminal from "./FaultyTerminal"
import { useResolvedDark } from "@/theme/store"

/**
 * Full-bleed version of the landing page's neutral terminal pattern.
 *
 * Theme aware: dark mode keeps the original dark wash; light mode renders a
 * lighter ink-on-paper variant so the pattern stays visible without competing
 * with the surrounding content.
 */
export function AuthBackground() {
  const dark = useResolvedDark()
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden bg-background"
    >
      <div className="absolute inset-0 opacity-40 dark:opacity-100">
        <ClientOnly>
          <FaultyTerminal
            scale={1.5}
            gridMul={[1, 1]}
            digitSize={1.2}
            timeScale={0.5}
            scanlineIntensity={0.2}
            glitchAmount={0.5}
            flickerAmount={0.35}
            noiseAmp={0.6}
            curvature={0}
            tint={dark ? "#777777" : "#8b93a1"}
            brightness={dark ? 0.65 : 1.15}
            lightMode={!dark}
            mouseReact
            mouseStrength={0.5}
            pageLoadAnimation={false}
            dpr={1}
            maxFps={24}
            maxPixels={600_000}
          />
        </ClientOnly>
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_34%,color-mix(in_oklch,var(--background)_38%,transparent)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_28%,color-mix(in_oklch,var(--background)_53%,transparent)_100%)]" />
    </div>
  )
}
