import { useEffect, useRef, useState } from "react"
import {
  CalendarDays,
  Files,
  Keyboard,
  PanelsTopLeft,
  SlidersHorizontal,
  Network,
} from "lucide-react"
import { Cell, LandingRow } from "@/components/landing/landing-grid"
import { useResolvedDark } from "@/theme/store"
import type { DemoSurface } from "@/lib/demo/preview-messages"
import { PreviewFrame } from "./live-preview"
import { Eyebrow, TextLink } from "./site"

const reasons = [
  {
    icon: PanelsTopLeft,
    label: "One workspace",
    title: "Go beyond the inbox.",
    detail:
      "Your email, calendar, contacts, and files share one home. Move from a customer conversation to the next task without leaving Ion.",
    href: "/demo",
    link: "Try the connected workspace",
  },
  {
    icon: SlidersHorizontal,
    label: "Your way of working",
    title: "Make the everyday feel effortless.",
    detail:
      "Choose your reading layout, organize conversations with folders and labels, and use keyboard shortcuts for the actions you repeat all day.",
    href: "/product#mail",
    link: "Find your workflow",
  },
  {
    icon: Network,
    label: "An open foundation",
    title: "Keep your options open.",
    detail:
      "Ion connects to a compatible mail server through the open JMAP protocol. Give your IT team a clear foundation to evaluate for your business.",
    href: "/enterprise",
    link: "Explore the architecture",
  },
]

function FeatureWorkspace({ initialSurface }: { initialSurface: DemoSurface }) {
  const host = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [surface, setSurface] = useState(initialSurface)
  const dark = useResolvedDark()
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px" }
    )
    if (host.current) observer.observe(host.current)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={host} className="ion-feature-window">
      <div className="ion-feature-window-bar">
        <span>ion / {surface}</span>
        <span>Interactive preview · Sample data</span>
      </div>
      <div className="ion-live-viewport">
        {visible ? (
          <PreviewFrame surface={surface} dark={dark} onSurface={setSurface} />
        ) : (
          <div className="ion-live-loading">
            Your workspace, ready when you are.
          </div>
        )}
      </div>
    </div>
  )
}

export function WhyIon() {
  return (
    <>
      <LandingRow id="why-ion" className="ion-editorial">
        <Cell className="ion-story-heading">
          <Eyebrow>01 / A connected working day</Eyebrow>
          <div className="ion-story-intro">
            <h2>
              Make room for
              <br />
              the work ahead.
            </h2>
            <div>
              <p>
                Email is only part of the day. Keep your calendar, contacts, and
                files within reach, in the same familiar workspace.
              </p>
              <TextLink href="/product#calendar">
                Explore your calendar
              </TextLink>
            </div>
          </div>
        </Cell>
        <Cell className="ion-product-scene">
          <FeatureWorkspace initialSurface="calendar" />
          <div className="ion-scene-note">
            <CalendarDays size={20} aria-hidden="true" />
            <strong>A little more perspective.</strong>
            <p>
              See the month. Check what’s next. Make space for the conversations
              that matter.
            </p>
          </div>
        </Cell>
        <Cell md={4} className="ion-feature-footnote">
          <span>01.1</span>
          <h3>Your day, in view</h3>
          <p>Browse your calendar and create events from one place.</p>
        </Cell>
        <Cell md={4} className="ion-feature-footnote">
          <span>01.2</span>
          <h3>People, close at hand</h3>
          <p>Keep customer and colleague details in your address books.</p>
        </Cell>
        <Cell md={4} className="ion-feature-footnote">
          <span>01.3</span>
          <h3>One way to get around</h3>
          <p>Switch apps from the same navigation, throughout your day.</p>
        </Cell>
      </LandingRow>
      <LandingRow className="ion-editorial ion-soft">
        <Cell className="ion-story-heading">
          <Eyebrow>02 / Keep the details together</Eyebrow>
          <div className="ion-story-intro">
            <h2>
              The next file.
              <br />
              The next step.
            </h2>
            <div>
              <p>
                Browse folders, find a document, and get back to the
                conversation. Everyday file management belongs close to everyday
                work.
              </p>
              <TextLink href="/product#files">Explore files in Ion</TextLink>
            </div>
          </div>
        </Cell>
        <Cell className="ion-product-scene ion-product-scene-reverse">
          <FeatureWorkspace initialSurface="files" />
          <div className="ion-scene-note">
            <Files size={20} aria-hidden="true" />
            <strong>A place for the details.</strong>
            <p>
              Folders, uploads, and downloads. Familiar tools for the documents
              your business works with.
            </p>
          </div>
        </Cell>
        <Cell md={6} className="ion-feature-footnote ion-shortcut-feature">
          <Keyboard size={22} aria-hidden="true" />
          <h3>Keep your hands on the keyboard.</h3>
          <p>
            Compose, archive, and move between apps with familiar shortcuts.
          </p>
          <TextLink href="/product#keyboard">Explore shortcuts</TextLink>
        </Cell>
        <Cell md={6} className="ion-shortcut-strip">
          <div>
            <kbd>⌘ / Ctrl K</kbd>
            <span>Open the command palette</span>
          </div>
          <div>
            <kbd>C</kbd>
            <span>Compose a message</span>
          </div>
          <div>
            <kbd>E</kbd>
            <span>Archive a selected conversation</span>
          </div>
        </Cell>
      </LandingRow>
      <LandingRow id="compare" className="ion-editorial">
        <Cell className="ion-story-heading">
          <Eyebrow>Why choose Ion</Eyebrow>
          <div className="ion-story-intro">
            <h2>
              Built around your day.
              <br />
              Chosen for your business.
            </h2>
            <p>
              Bring the essentials together, shape the workspace around your
              habits, and build on an open foundation. That’s the Ion approach
              to a better working day.
            </p>
          </div>
        </Cell>
        {reasons.map(({ icon: Icon, ...item }) => (
          <Cell
            md={4}
            className="ion-compare-card ion-reason-card"
            key={item.label}
          >
            <div className="ion-reason-icon">
              <Icon size={23} aria-hidden="true" />
            </div>
            <span className="ion-reason-label">{item.label}</span>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
            <TextLink href={item.href}>{item.link}</TextLink>
          </Cell>
        ))}
        <Cell className="ion-reason-proof">
          <div>
            <strong>See the difference in your own workflow.</strong>
            <p>Try the real interface with sample data. No account needed.</p>
          </div>
          <TextLink href="/demo">Try Ion for yourself</TextLink>
        </Cell>
      </LandingRow>
    </>
  )
}
