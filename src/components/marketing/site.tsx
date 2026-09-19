import { ThemeSwitch } from "@/components/theme/theme-switch"
import type { ReactNode } from "react"
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Mail,
  CalendarDays,
  Users,
  Files,
} from "lucide-react"
import { useSession } from "@/hooks/use-session"
import { IonLogo } from "@/components/brand/logo"
import {
  Cell,
  LandingRow,
  LandingShell,
} from "@/components/landing/landing-grid"
import { HoverLift } from "@/components/landing/landing-motion"
import "@/components/landing/landing.css"

export const surfaces = [
  {
    id: "mail",
    name: "Mail",
    icon: Mail,
    title: "Keep the conversation moving.",
    description:
      "Read conversations in context, organize your inbox, and compose your next reply without losing your place.",
    example: "From a customer question to your next reply.",
    points: [
      "Threaded conversations",
      "Search, folders, and labels",
      "Drafts and attachments",
    ],
  },
  {
    id: "calendar",
    name: "Calendar",
    icon: CalendarDays,
    title: "Make room for what’s next.",
    description:
      "See the shape of your day alongside your email. Review upcoming events and plan your week in the same workspace.",
    example: "From your morning inbox to the afternoon meeting.",
    points: [
      "Month calendar",
      "Event creation and details",
      "Upcoming events at a glance",
    ],
  },
  {
    id: "contacts",
    name: "Contacts",
    icon: Users,
    title: "Put people within reach.",
    description:
      "Keep the details behind your business relationships organized, from a new customer to a familiar supplier.",
    example: "Find the right person when the conversation matters.",
    points: [
      "Create and edit contacts",
      "Address books",
      "Contact details in one place",
    ],
  },
  {
    id: "files",
    name: "Files",
    icon: Files,
    title: "Find the file. Carry on.",
    description:
      "Browse and organize files without leaving your workspace. Keep the documents you need close to the work you’re doing.",
    example: "Keep the latest proposal a few clicks away.",
    points: [
      "Folders and file browsing",
      "Uploads and downloads",
      "A familiar workspace view",
    ],
  },
] as const

export function Action({
  href,
  children,
  secondary = false,
}: {
  href: string
  children: ReactNode
  secondary?: boolean
}) {
  // Full navigation deliberately separates demo and authenticated runtimes.
  return (
    <a
      className={secondary ? "ion-button ion-button-secondary" : "ion-button"}
      href={href}
    >
      {children}
      <ArrowUpRight size={17} aria-hidden="true" />
    </a>
  )
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="ion-kicker">{children}</p>
}

export function Site({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  return (
    <LandingShell>
      <a href="#main" className="landing-skip">
        Skip to content
      </a>
      <header className="ion-header">
        <div className="ion-header-inner">
          <a href="/" aria-label="Ion home" className="ion-brand">
            <IonLogo size={29} animateOnHover />
          </a>
          <nav aria-label="Main navigation">
            <a href="/product">Product</a>
            <a href="/roadmap">Roadmap</a>
            <a href="/enterprise">Enterprise</a>
          </nav>
          <div className="ion-header-actions">
            <a href={session ? "/app" : "/login"}>
              {session ? "Open workspace" : "Sign in"}
            </a>
            <Action href="/demo">Try demo workspace</Action>
          </div>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="ion-footer">
        <LandingRow>
          <Cell md={6} className="ion-pad">
            <a href="/" aria-label="Ion home" className="ion-footer-logo">
              <IonLogo size={48} animateOnHover />
            </a>
            <p className="ion-footer-statement">
              A place for work.
              <br />
              Room for your business.
            </p>
            <p className="ion-body">
              Email, calendars, contacts, and files.
              <br />
              Managed business workspace · Private pilot.
            </p>
          </Cell>
          {[
            {
              heading: "Product",
              links: [
                ["Overview", "/product"],
                ["Roadmap", "/roadmap"],
                ["Mail", "/product#mail"],
                ["Calendar", "/product#calendar"],
                ["Contacts & files", "/product#contacts"],
              ],
            },
            {
              heading: "Business",
              links: [
                ["Private pilot", "/#how"],
                ["Enterprise evaluation", "/enterprise"],
                ["Open foundation", "/product#protocol"],
                ["Common questions", "/#faq"],
              ],
            },
            {
              heading: "Access",
              links: [
                ["Try the demo", "/demo"],
                ["Request pilot access", "/request-access"],
                ["Sign in", "/login"],
                ["Back to top ↑", "#main"],
              ],
            },
          ].map((group) => (
            <Cell
              md={2}
              span={2}
              className="ion-footer-column"
              key={group.heading}
            >
              <h2>{group.heading}</h2>
              {group.links.map(([label, href]) => (
                <a key={label} href={href}>
                  {label}
                </a>
              ))}
            </Cell>
          ))}
          <Cell className="ion-footer-bottom">
            <span>© {new Date().getFullYear()} Ion</span>
            <div className="ion-footer-theme">
              <span>Appearance</span>
              <ThemeSwitch />
            </div>
          </Cell>
        </LandingRow>
      </footer>
    </LandingShell>
  )
}

export { LivePreview as DemoPreview } from "./live-preview"

export function FinalCTA() {
  return (
    <LandingRow id="get-started" tone="ion-inverse ion-cta" atmosphere>
      <Cell md={7} className="ion-pad ion-cta-heading">
        <Eyebrow>Your next chapter of work</Eyebrow>
        <h2>
          A better place
          <br />
          for your
          <br />
          <span>working day.</span>
        </h2>
        <p className="ion-body">
          Email, calendars, contacts, and files.
          <br />
          All the essentials. A little more room to work.
        </p>
      </Cell>
      <Cell md={5} className="ion-pad ion-cta-choices">
        <span className="ion-pilot-label">Managed Ion · Private pilot</span>
        <a href="/demo" className="ion-cta-choice ion-cta-choice-primary">
          <span className="ion-cta-choice-top">
            <span>01 / Take a look inside</span>
            <ArrowUpRight size={23} aria-hidden="true" />
          </span>
          <strong>Try demo workspace</strong>
          <span>
            Make yourself at home with sample data.
            <br />
            No account. No setup.
          </span>
        </a>
        <a href="/request-access" className="ion-cta-choice">
          <span className="ion-cta-choice-top">
            <span>02 / Make it your next step</span>
            <ArrowUpRight size={23} aria-hidden="true" />
          </span>
          <strong>Request pilot access</strong>
          <span>
            Tell us about your business.
            <br />
            Let’s see if the managed pilot is a fit.
          </span>
        </a>
      </Cell>
      {surfaces.map(({ id, name, icon: Icon }) => (
        <Cell span={2} md={3} key={id} className="ion-cta-surface">
          <Icon size={17} aria-hidden="true" />
          <span>{name}</span>
        </Cell>
      ))}
    </LandingRow>
  )
}

export function Benefits() {
  return (
    <LandingRow id="why">
      {[
        [
          "01",
          "Less switching. More continuity.",
          "Move between a customer email, your next meeting, and the details you need in one workspace.",
        ],
        [
          "02",
          "Familiar from the first click.",
          "An inbox, a calendar, and clear navigation. Everyday tools that don’t ask you to learn a new way to work.",
        ],
        [
          "03",
          "Try it with your work in mind.",
          "Explore the demo first. Then tell us about your business so we can assess whether the managed pilot fits.",
        ],
      ].map(([n, title, copy]) => (
        <Cell md={4} key={n}>
          <HoverLift className="ion-pad ion-benefit">
            <span className="ion-index">{n}</span>
            <h3>{title}</h3>
            <p className="ion-body">{copy}</p>
          </HoverLift>
        </Cell>
      ))}
    </LandingRow>
  )
}

export function FAQ() {
  return (
    <LandingRow id="faq">
      <Cell md={4} className="ion-pad">
        <Eyebrow>A little more clarity</Eyebrow>
        <h2 className="ion-heading">
          Before you
          <br />
          make yourself
          <br />
          at home.
        </h2>
      </Cell>
      <Cell md={8} className="ion-faq">
        {[
          [
            "Who is Ion for?",
            "Ion is designed for small and medium businesses that want email, calendars, contacts, and files in a connected workspace. Larger organizations can explore our enterprise evaluation page and share their requirements.",
          ],
          [
            "Can I try it without an account?",
            "Yes. The demo uses sample data and requires no account. Changes stay in the demo and reset when you refresh. Messages are simulated, not delivered.",
          ],
          [
            "Is the managed service available now?",
            "Managed Ion is in private pilot. Request access to tell us about your business. Submitting a request does not create an account or guarantee admission.",
          ],
          [
            "What about pricing, migration, and support?",
            "These are discussed as part of pilot evaluation. We do not yet publish standard plans or make commitments about migration, support levels, or enterprise requirements.",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <Plus size={18} aria-hidden="true" />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </Cell>
    </LandingRow>
  )
}

export function TextLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <a className="ion-text-link" href={href}>
      {children}
      <ArrowRight size={17} aria-hidden="true" />
    </a>
  )
}
