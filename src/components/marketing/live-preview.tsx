import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { useResolvedDark } from "@/theme/store"
import { DEMO_SURFACES, isDemoSurface } from "@/lib/demo/preview-messages"
import type { DemoSurface } from "@/lib/demo/preview-messages"

/** A separate demo document keeps app stores and shortcuts out of marketing. */
export function LivePreview() {
  const [surface, setSurface] = useState<DemoSurface>("mail")
  const [active, setActive] = useState(false)
  const host = useRef<HTMLDivElement>(null)
  const dark = useResolvedDark()
  useEffect(() => {
    if (!host.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { rootMargin: "160px" }
    )
    observer.observe(host.current)
    return () => observer.disconnect()
  }, [])
  return (
    <div className="ion-live-preview" ref={host}>
      <div className="ion-live-intro">
        <div>
          <p className="ion-kicker">This is Ion. Make yourself at home.</p>
          <h2>
            Your workspace.
            <br />
            Already open.
          </h2>
        </div>
        <p>
          The real interface, ready to explore.
          <br />
          Open a conversation. Plan your day.
          <br />
          See how it all comes together.
        </p>
      </div>
      <div className="ion-live-toolbar">
        <div className="ion-tabs" aria-label="Workspace preview apps">
          {DEMO_SURFACES.map((name) => (
            <button
              type="button"
              key={name}
              aria-pressed={surface === name}
              aria-controls="live-workspace"
              onClick={() => {
                setSurface(name)
                setActive(true)
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <div className="ion-live-stage">
        <div id="live-workspace" className="ion-live-viewport">
          {active ? (
            <PreviewFrame
              surface={surface}
              dark={dark}
              onSurface={setSurface}
            />
          ) : (
            <div className="ion-live-loading">
              <span className="ion-live-status-dot" />
              <p>Your sample workspace is ready.</p>
              <button type="button" onClick={() => setActive(true)}>
                Explore Ion ↗
              </button>
            </div>
          )}
        </div>
        <div className="ion-live-caption">
          <span>
            <i aria-hidden="true" />
            Live product demo
          </span>
          <span>Sample data only · Messages are simulated</span>
        </div>
      </div>
    </div>
  )
}
export function PreviewFrame({
  surface,
  dark,
  onSurface,
}: {
  surface: DemoSurface
  dark: boolean
  onSurface: (surface: DemoSurface) => void
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const [scale, setScale] = useState(1)
  const [slow, setSlow] = useState(false)
  const [src] = useState(
    () => `/demo?embed=true&surface=${surface}&theme=${dark ? "dark" : "light"}`
  )
  useEffect(() => {
    const stage = frame.current?.parentElement
    if (!stage) return
    const observer = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / 1120)
    )
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const sendConfig = () =>
      frame.current?.contentWindow?.postMessage(
        { type: "ion:preview-config", surface, theme: dark ? "dark" : "light" },
        window.location.origin
      )
    function receive(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow
      )
        return
      if (event.data?.type === "ion:preview-ready") {
        setReady(true)
        sendConfig()
      }
      if (
        event.data?.type === "ion:preview-surface" &&
        isDemoSurface(event.data.surface)
      )
        onSurface(event.data.surface)
    }
    window.addEventListener("message", receive)
    sendConfig()
    return () => window.removeEventListener("message", receive)
  }, [surface, dark, onSurface])
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 12_000)
    return () => clearTimeout(timer)
  }, [])
  return (
    <>
      {!ready && (
        <div className="ion-live-loading" role="status">
          <p>
            {slow
              ? "The workspace is taking a little longer to open."
              : "Opening your sample workspace…"}
          </p>
          {slow && <a href="/demo">Open the full demo ↗</a>}
        </div>
      )}
      <iframe
        ref={frame}
        style={{ "--ion-preview-scale": scale } as CSSProperties}
        src={src}
        title="Interactive Ion workspace with sample data"
        className={ready ? "ion-live-frame is-ready" : "ion-live-frame"}
        tabIndex={ready ? 0 : -1}
        aria-hidden={!ready}
        sandbox="allow-scripts allow-same-origin allow-downloads"
      />
    </>
  )
}
