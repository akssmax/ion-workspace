import { useState } from "react"
import { Link } from "@tanstack/react-router"
import {
  ArrowRight,
  CalendarDays,
  FileText,
  Keyboard,
  Lock,
  Mail,
  Server,
  Shield,
  Users,
  Zap,
} from "lucide-react"
import { cn } from "cn"
import { IonLogo } from "@/components/brand/logo"
import { ThemeSwitch } from "@/components/theme/theme-switch"
import { Cell, LandingRow, LandingShell } from "./landing-grid"
import {
  ProductPreview,
  type PreviewSurface,
} from "./product-preview"

const NAV = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#protocol", label: "Protocol" },
  { href: "#faq", label: "FAQ" },
]

const SURFACES: {
  id: PreviewSurface
  label: string
  kicker: string
  title: string
  body: string
  icon: typeof Mail
}[] = [
  {
    id: "mail",
    label: "Mail",
    kicker: "01",
    title: "Threaded mail, on JMAP.",
    body: "Operator search, labels, and a composer that already knows reply, reply-all, and forward.",
    icon: Mail,
  },
  {
    id: "calendar",
    label: "Calendar",
    kicker: "02",
    title: "The week, in the same session.",
    body: "Month grid and events beside the inbox. Jump to today without leaving the keyboard.",
    icon: CalendarDays,
  },
  {
    id: "contacts",
    label: "Contacts",
    kicker: "03",
    title: "People, once.",
    body: "Address books that autocomplete in compose. One source of names across mail and calendar.",
    icon: Users,
  },
  {
    id: "files",
    label: "Files",
    kicker: "04",
    title: "Attachments that stay put.",
    body: "Browse, upload, and download next to the thread they belong to.",
    icon: FileText,
  },
]

const STATS = [
  { value: "4", label: "apps, one shell" },
  { value: "JMAP", label: "as source of truth" },
  { value: "⌘K", label: "command palette" },
  { value: "0", label: "suite lock-in" },
]

const STEPS = [
  {
    kicker: "01",
    title: "Point it at your server",
    body: "Ion is a client. Give it a JMAP endpoint — Stalwart or any compatible server — and it talks RFC 8620 / 8621.",
  },
  {
    kicker: "02",
    title: "Sign in once",
    body: "A single session hydrates mailboxes, calendars, address books, and files. No extra tenants, no extra logins.",
  },
  {
    kicker: "03",
    title: "Work from the rail",
    body: "Switch apps without switching products. The palette, shortcuts, and compose flow stay in the same chrome.",
  },
]

const PRINCIPLES = [
  {
    icon: Server,
    title: "Your server. Your mail.",
    body: "Ion talks JMAP — RFC 8620 and 8621 — to Stalwart or any compatible server. The protocol is the product.",
  },
  {
    icon: Keyboard,
    title: "Keyboard first, always.",
    body: "Compose with C, search with /, archive with E. The palette is a keystroke away.",
  },
  {
    icon: Zap,
    title: "Fast path to the work.",
    body: "No tabs of settings before an inbox. Sign in, and the four apps are already in the rail.",
  },
]

const COMPARE = [
  {
    label: "Where it runs",
    ion: "Your JMAP server",
    suite: "Their cloud",
  },
  {
    label: "Protocol",
    ion: "Open JMAP",
    suite: "Proprietary APIs",
  },
  {
    label: "Apps",
    ion: "Four surfaces, one rail",
    suite: "Separate products",
  },
  {
    label: "Identity",
    ion: "One session",
    suite: "Account sprawl",
  },
]

const KEYS = [
  ["C", "Compose"],
  ["/", "Search"],
  ["E", "Archive"],
  ["⌘K", "Palette"],
]

const FAQS = [
  {
    q: "What is JMAP?",
    a: "A modern mail protocol — JSON over HTTPS, with push, instead of IMAP’s chatter. Ion is built against it, not around it.",
  },
  {
    q: "Do I need a special server?",
    a: "Any JMAP-compatible server works. The mock mode ships with demo credentials so you can try the shell without one.",
  },
  {
    q: "Where does my mail live?",
    a: "On your server. Ion is a client: it never becomes the source of truth, and it does not lock you into a suite.",
  },
  {
    q: "Is it only mail?",
    a: "Mail, calendar, contacts, and files share the same session and command palette. Nothing is a bolt-on tab.",
  },
]

const TONE = {
  canvas: "bg-background",
  mist: "bg-zinc-50 dark:bg-zinc-950",
  fog: "bg-zinc-100 dark:bg-zinc-900",
  pebble: "bg-zinc-200/80 dark:bg-zinc-800/50",
  ash: "bg-neutral-100 dark:bg-neutral-900",
  ink: "bg-zinc-50 dark:bg-black",
}

export function LandingPage() {
  const [surface, setSurface] = useState<PreviewSurface>("mail")

  return (
    <LandingShell>
      <div className="sticky top-0 z-50">
        <LandingRow top>
          <Cell
            span={4}
            md={12}
            className="bg-background/55 backdrop-blur-md"
          >
            <div className="flex h-14 items-center justify-between px-4 sm:px-6">
              <a href="#top" className="text-foreground" aria-label="Ion home">
                <IonLogo size={22} />
              </a>
              <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
                {NAV.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="hidden rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
                >
                  Sign in
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-8 items-center rounded-full bg-foreground px-3.5 text-sm font-medium text-background"
                >
                  Open workspace
                </Link>
              </div>
            </div>
          </Cell>
        </LandingRow>
      </div>

      <main>
      <LandingRow id="top" atmosphere tall>
        <Cell
          span={4}
          md={6}
          className="flex flex-col justify-center px-5 py-16 sm:px-8 sm:py-20 lg:py-24"
        >
          <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            JMAP workspace
          </p>
          <h1 className="mt-4 text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl lg:text-[3.75rem]">
            Four apps.
            <br />
            One protocol.
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background"
            >
              Open workspace
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#product"
              className="inline-flex h-10 items-center rounded-full border border-border bg-background/50 px-4 text-sm font-medium backdrop-blur-sm hover:bg-background/80"
            >
              See the product
            </a>
          </div>
        </Cell>
        <Cell
          span={4}
          md={6}
          className="flex flex-col justify-center px-5 py-16 sm:px-8 sm:py-20 lg:py-24"
        >
          <p className="max-w-md text-base leading-relaxed text-foreground/80 sm:text-lg">
            Ion is a JMAP-native workspace for mail, calendar, contacts, and
            files. Keyboard-first, and designed to run on your server — not
            inside someone else’s suite.
          </p>
        </Cell>
      </LandingRow>

        <LandingRow tone={TONE.fog}>
          <Cell span={4} md={12} className="px-4 py-6 sm:px-6 sm:py-8">
            <div className="mb-4 flex w-fit flex-wrap gap-1 rounded-full border border-border bg-background/80 p-1">
              {SURFACES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSurface(item.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm transition-colors",
                    surface === item.id
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <ProductPreview surface={surface} />
          </Cell>
        </LandingRow>

        <LandingRow tone={TONE.canvas}>
          {STATS.map((stat) => (
            <Cell key={stat.label} span={2} md={3} className="px-5 py-8 sm:px-6">
              <p className="font-mono text-3xl tracking-tight sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </Cell>
          ))}
        </LandingRow>

        <LandingRow id="product" tone={TONE.mist}>
          <Cell span={4} md={5} className="scroll-mt-16 px-5 py-10 sm:px-8 sm:py-14">
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Four surfaces
            </p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">
              Built on the same rail.
            </h2>
          </Cell>
          <Cell
            span={4}
            md={7}
            className="flex items-end px-5 py-10 sm:px-8 sm:py-14"
          >
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              Mail, calendar, contacts, and files share a session, a command
              palette, and a protocol. Nothing is a bolt-on tab.
            </p>
          </Cell>
        </LandingRow>

        <LandingRow tone={TONE.mist}>
          {SURFACES.map((app) => (
            <Cell
              key={app.id}
              span={4}
              md={app.id === "mail" || app.id === "files" ? 7 : 5}
              className="px-5 py-8 sm:px-8 sm:py-10"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-background/70">
                  <app.icon className="size-5" />
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {app.kicker}
                </span>
              </div>
              <h3 className="text-xl font-medium">{app.title}</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {app.body}
              </p>
            </Cell>
          ))}
        </LandingRow>

        <LandingRow id="how" tone={TONE.pebble}>
          <Cell span={4} md={12} className="scroll-mt-16 px-5 py-10 sm:px-8 sm:py-14">
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              How it works
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-medium tracking-tight sm:text-4xl">
              Connect the protocol.
              <span className="text-muted-foreground"> Keep the desk.</span>
            </h2>
          </Cell>
        </LandingRow>

        <LandingRow tone={TONE.pebble}>
          {STEPS.map((step) => (
            <Cell key={step.kicker} span={4} md={4} className="px-5 py-8 sm:px-8 sm:py-12">
              <p className="font-mono text-[11px] text-muted-foreground">
                {step.kicker}
              </p>
              <h3 className="mt-4 text-lg font-medium">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </Cell>
          ))}
        </LandingRow>

        <LandingRow id="protocol" tone={TONE.ash}>
          <Cell span={4} md={12} className="scroll-mt-16 px-5 py-10 sm:px-8 sm:py-14">
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              The protocol
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-medium tracking-tight sm:text-4xl">
              Built like infrastructure.
              <span className="text-muted-foreground"> Used like a desk.</span>
            </h2>
          </Cell>
        </LandingRow>

        <LandingRow tone={TONE.ash}>
          {PRINCIPLES.map((item) => (
            <Cell key={item.title} span={4} md={4} className="px-5 py-8 sm:px-8 sm:py-12">
              <item.icon className="mb-4 size-5" />
              <h3 className="text-lg font-medium">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </Cell>
          ))}
        </LandingRow>

        <LandingRow tone={TONE.fog}>
          <Cell span={4} md={5} className="px-5 py-10 sm:px-8 sm:py-14">
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Versus a suite
            </p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">
              The opposite of lock-in.
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Suites rent you the protocol. Ion assumes you already have one.
            </p>
          </Cell>
          <Cell span={4} md={7} className="grid grid-cols-[1fr_1fr_1fr] content-stretch text-sm">
            <div className="border-e border-border px-4 py-4 text-[11px] font-medium tracking-wide text-muted-foreground uppercase sm:px-6">
              &nbsp;
            </div>
            <div className="border-e border-border px-4 py-4 text-[11px] font-medium tracking-wide uppercase sm:px-6">
              Ion
            </div>
            <div className="px-4 py-4 text-[11px] font-medium tracking-wide text-muted-foreground uppercase sm:px-6">
              Suites
            </div>
            {COMPARE.map((row) => (
              <div key={row.label} className="contents">
                <div className="border-e border-t border-border px-4 py-4 text-muted-foreground sm:px-6">
                  {row.label}
                </div>
                <div className="border-e border-t border-border px-4 py-4 font-medium sm:px-6">
                  {row.ion}
                </div>
                <div className="border-t border-border px-4 py-4 text-muted-foreground sm:px-6">
                  {row.suite}
                </div>
              </div>
            ))}
          </Cell>
        </LandingRow>

        <LandingRow id="shortcuts" tone={TONE.canvas}>
          <Cell span={4} md={5} className="scroll-mt-16 px-5 py-10 sm:px-8 sm:py-14">
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Keyboard
            </p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">
              Stay on the keys.
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Gmail-familiar where it helps, Ion-native where it should be. The
              palette searches apps, mailboxes, and actions from one prompt.
            </p>
          </Cell>
          <Cell span={4} md={7} className="grid grid-cols-2 content-stretch">
            {KEYS.map(([key, label], i) => (
              <div
                key={key}
                className={cn(
                  "flex flex-col justify-between px-5 py-6 sm:px-8",
                  i % 2 === 0 && "border-e border-border",
                  i < 2 && "border-b border-border"
                )}
              >
                <kbd className="font-mono text-sm">{key}</kbd>
                <p className="mt-8 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </Cell>
        </LandingRow>

        <LandingRow tone={TONE.mist}>
          <Cell span={4} md={4} className="px-5 py-10 sm:px-8 sm:py-14">
            <Shield className="mb-4 size-5" />
            <h3 className="text-lg font-medium">Self-hosted by default</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Mailboxes never migrate into Ion. The workspace is a client of
              whatever JMAP server you already run.
            </p>
          </Cell>
          <Cell span={4} md={4} className="px-5 py-10 sm:px-8 sm:py-14">
            <Lock className="mb-4 size-5" />
            <h3 className="text-lg font-medium">Session, not a tenant</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Sign in, get a session. Calendars, contacts, and files ride the
              same handshake as mail.
            </p>
          </Cell>
          <Cell span={4} md={4} className="px-5 py-10 sm:px-8 sm:py-14">
            <Server className="mb-4 size-5" />
            <h3 className="text-lg font-medium">Stalwart-ready</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Built against a real JMAP stack. Mock mode is for the demo —
              production talks to your endpoint.
            </p>
          </Cell>
        </LandingRow>

        <LandingRow id="faq" tone={TONE.pebble}>
          <Cell span={4} md={5} className="scroll-mt-16 px-5 py-10 sm:px-8 sm:py-14">
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">
              Before you open the rail.
            </h2>
          </Cell>
          <Cell span={4} md={7} className="divide-y divide-border">
            {FAQS.map((item) => (
              <div key={item.q} className="px-5 py-6 sm:px-8 sm:py-8">
                <h3 className="text-sm font-medium">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </div>
            ))}
          </Cell>
        </LandingRow>

        <LandingRow atmosphere>
          <Cell
            span={4}
            md={12}
            className="border-border/60 px-5 py-20 text-center sm:px-8 sm:py-28"
          >
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Get started
            </p>
            <h2 className="mt-4 text-3xl font-medium tracking-tight sm:text-5xl">
              Open the workspace.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-foreground/80 sm:text-base">
              Sign in with your JMAP account — or the demo credentials — and
              pick up mail, calendar, contacts, and files in one rail.
            </p>
            <Link
              to="/login"
              className="mt-8 inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background"
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </Cell>
        </LandingRow>
      </main>

      <LandingRow tone={TONE.ink}>
        <Cell span={4} md={4} className="flex flex-col justify-between gap-6 px-5 py-8 sm:px-8">
          <IonLogo size={20} />
          <p className="text-xs text-muted-foreground">
            JMAP-native mail, calendar, contacts &amp; files.
          </p>
        </Cell>
        <Cell span={2} md={2} className="px-5 py-8">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Product
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="#product" className="hover:underline">
                Surfaces
              </a>
            </li>
            <li>
              <a href="#how" className="hover:underline">
                How it works
              </a>
            </li>
            <li>
              <a href="#shortcuts" className="hover:underline">
                Shortcuts
              </a>
            </li>
          </ul>
        </Cell>
        <Cell span={2} md={2} className="px-5 py-8">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Protocol
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="#protocol" className="hover:underline">
                JMAP
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:underline">
                FAQ
              </a>
            </li>
            <li>
              <Link to="/login" className="hover:underline">
                Sign in
              </Link>
            </li>
          </ul>
        </Cell>
        <Cell
          span={4}
          md={4}
          className="flex flex-col items-start justify-between gap-6 overflow-visible px-5 py-8 sm:px-8"
        >
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Theme
          </p>
          <ThemeSwitch />
        </Cell>
      </LandingRow>
    </LandingShell>
  )
}
