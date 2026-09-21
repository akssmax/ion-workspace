import { Suspense, useEffect, useRef, useState } from "react"
import { lazyWithRetry } from "@/lib/lazy-with-retry"

const FaultyTerminal = lazyWithRetry(
  () => import("@/components/effects/FaultyTerminal")
)

/** Deferred section-local canvas; each instance pauses when offscreen. */
export function LandingBackground({
  inverted = false,
}: {
  inverted?: boolean
}) {
  const host = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const element = host.current
    if (!element) return
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let inView = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let idle: number | undefined
    let disposed = false
    function cancel() {
      clearTimeout(timer)
      if (idle !== undefined) window.cancelIdleCallback(idle)
    }
    function schedule() {
      cancel()
      if (motion.matches) {
        setReady(false)
        return
      }
      if (document.hidden || !inView) return
      // Allow the primary content to paint before downloading/compiling WebGL.
      timer = setTimeout(() => {
        const load = () => {
          if (!disposed) setReady(true)
        }
        if ("requestIdleCallback" in window) {
          idle = window.requestIdleCallback(load, { timeout: 1500 })
        } else {
          load()
        }
      }, 250)
    }
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      // Once loaded, retain the context. The renderer pauses itself offscreen.
      if (inView) schedule()
      else cancel()
    })
    observer.observe(element)
    motion.addEventListener("change", schedule)
    document.addEventListener("visibilitychange", schedule)
    return () => {
      disposed = true
      cancel()
      observer.disconnect()
      motion.removeEventListener("change", schedule)
      document.removeEventListener("visibilitychange", schedule)
    }
  }, [])

  return (
    <div
      ref={host}
      className={`ion-hero-background ${inverted ? "ion-terminal-inverted" : ""}`}
      aria-hidden="true"
    >
      {ready && (
        <Suspense fallback={null}>
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
            tint={inverted ? "#dddddd" : "#777777"}
            brightness={0.65}
            mouseReact
            mouseStrength={0.5}
            pageLoadAnimation={false}
            dpr={1}
            maxFps={24}
            maxPixels={inverted ? 400_000 : 600_000}
          />
        </Suspense>
      )}
    </div>
  )
}
