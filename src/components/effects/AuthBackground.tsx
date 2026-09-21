import { ClientOnly } from "@tanstack/react-router"
import FaultyTerminal from "./FaultyTerminal"

/**
 * Full-bleed version of the landing page's neutral dark terminal pattern.
 */
export function AuthBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden bg-background"
    >
      <div className="absolute inset-0">
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
            tint="#777777"
            brightness={0.65}
            mouseReact
            mouseStrength={0.5}
            pageLoadAnimation={false}
            dpr={1}
            maxFps={24}
            maxPixels={600_000}
          />
        </ClientOnly>
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_28%,color-mix(in_oklch,var(--background)_53%,transparent)_100%)]" />
    </div>
  )
}
