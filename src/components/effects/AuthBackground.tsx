import { ClientOnly } from "@tanstack/react-router"
import FaultyTerminal from "./FaultyTerminal"

interface AuthBackgroundProps {
  /**
   * Opacity of the soft gradient wash placed above the WebGL canvas to keep
   * foreground cards legible.
   */
  overlayClassName?: string
}

/**
 * Full-bleed FaultyTerminal background shared by the sign-in screen and the
 * onboarding/landing screen. Props match the requested React Bits usage.
 */
export function AuthBackground({
  overlayClassName = "bg-gradient-to-b from-white/70 via-white/60 to-white/80 dark:from-black/70 dark:via-black/60 dark:to-black/80",
}: AuthBackgroundProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute inset-0">
        <ClientOnly>
          <FaultyTerminal
            scale={1.5}
            gridMul={[2, 1]}
            digitSize={1.2}
            timeScale={1}
            pause={false}
            scanlineIntensity={0.28}
            glitchAmount={1}
            flickerAmount={1}
            noiseAmp={1}
            chromaticAberration={0}
            dither={0}
            curvature={0}
            tint="#3f6212"
            mouseReact={true}
            mouseStrength={0.5}
            pageLoadAnimation={false}
            brightness={0.45}
            lightMode
          />
        </ClientOnly>
      </div>
      <div className={`absolute inset-0 ${overlayClassName}`} />
    </div>
  )
}
