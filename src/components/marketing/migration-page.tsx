import { CalendarDays, Files, Mail, Users } from "lucide-react"
import { Cell, LandingRow } from "@/components/landing/landing-grid"
import { Action, Eyebrow, Site, TextLink } from "./site"

const migrated = [
  {
    icon: Mail,
    name: "Mail",
    note: "Imported over IMAP into JMAP storage. Folders map to their equivalents; labels are preserved as far as the source supports them.",
  },
  {
    icon: Users,
    name: "Contacts",
    note: "vCard or CSV import into address books, with duplicates surfaced for review rather than silently merged.",
  },
  {
    icon: CalendarDays,
    name: "Calendars",
    note: "ICS export and import, including recurring series. Invitations are re-confirmed after cutover.",
  },
  {
    icon: Files,
    name: "Files",
    note: "Copied directly with folder structure intact. Sharing permissions are rebuilt in Ion during review.",
  },
]

const cutoverSteps: [string, string, string][] = [
  [
    "01",
    "Run in parallel",
    "New mail keeps arriving in both systems while history imports in the background.",
  ],
  [
    "02",
    "Cut over",
    "MX records switch in a planned window — typically an evening or weekend, agreed in advance.",
  ],
  [
    "03",
    "Verify together",
    "We walk folders, threads, and calendars with your team before anyone touches the old system.",
  ],
]

const timeline: [string, string, string][] = [
  [
    "Week 0",
    "Checklist and prep",
    "DNS plan, user list, source exports, and a client configuration review with your IT team.",
  ],
  [
    "Week 1",
    "Mail and contacts",
    "History imports while the team works as usual. Contacts land in address books for review.",
  ],
  [
    "Week 2",
    "Calendars, files, cutover",
    "Events and documents complete, then the switch — during the window you chose.",
  ],
]

const itChecklist = [
  "DNS changes: MX, SPF, DKIM, and DMARC records",
  "User provisioning and naming conventions",
  "SSO and identity planning (SAML is on the roadmap)",
  "Client expectations: the Ion web workspace first, JMAP-capable clients where needed",
  "An agreed retention period on the old system before decommissioning",
]

export function MigrationPage() {
  return (
    <Site>
      <LandingRow id="top" top>
        <Cell md={8} className="ion-pad ion-page-hero">
          <Eyebrow>Migration</Eyebrow>
          <h1>
            Moving from Google Workspace
            <br />
            or Zoho? Here&rsquo;s how.
          </h1>
          <p className="ion-body ion-readable">
            We migrate the four essentials — mail, contacts, calendars, and
            files — with a cutover plan your IT team reviews before anything
            changes.
          </p>
          <p className="ion-small">
            Every migration is scoped during the pilot. The steps below are the
            typical shape.
          </p>
        </Cell>
        <Cell md={4} className="ion-pad ion-align-end">
          <span className="ion-pilot-label">Managed Ion · Private pilot</span>
          <p className="ion-body">
            No tool to download. A plan, a window, and a person responsible.
          </p>
        </Cell>
      </LandingRow>

      <LandingRow id="what" className="ion-editorial">
        <Cell className="ion-story-heading">
          <Eyebrow>What gets migrated</Eyebrow>
          <div className="ion-story-intro">
            <h2>
              Four essentials.
              <br />
              One move each.
            </h2>
            <p>
              Format and protocol notes for the things your business runs on
              today.
            </p>
          </div>
        </Cell>
        {migrated.map((item) => {
          const Icon = item.icon
          return (
            <Cell md={3} key={item.name} className="ion-compare-card">
              <Icon size={20} aria-hidden="true" />
              <h3>{item.name}</h3>
              <p>{item.note}</p>
            </Cell>
          )
        })}
      </LandingRow>

      <LandingRow id="cutover" tone="ion-soft">
        <Cell md={4} className="ion-pad">
          <Eyebrow>Downtime expectations</Eyebrow>
          <h2 className="ion-heading">
            A window,
            <br />
            not a leap.
          </h2>
          <p className="ion-body">
            Exact downtime depends on mailbox size and the source system. We
            agree the window in advance, and never switch mid-week by default.
          </p>
        </Cell>
        <Cell md={8} className="ion-pilot-steps">
          {cutoverSteps.map(([n, t, c]) => (
            <div key={n}>
              <span>{n}</span>
              <div>
                <h3>{t}</h3>
                <p className="ion-body">{c}</p>
              </div>
            </div>
          ))}
        </Cell>
      </LandingRow>

      <LandingRow id="timeline">
        <Cell md={12} className="ion-story-heading">
          <Eyebrow>Timeline</Eyebrow>
          <div className="ion-story-intro">
            <h2>A typical window.</h2>
            <p>
              Shown for a team of around twenty seats. Larger organizations
              take longer; the plan states it before we start.
            </p>
          </div>
        </Cell>
        {timeline.map(([when, title, copy]) => (
          <Cell md={4} key={when} className="ion-pilot-card">
            <span>{when}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </Cell>
        ))}
      </LandingRow>

      <LandingRow id="checklist" tone="ion-soft">
        <Cell md={4} className="ion-pad">
          <Eyebrow>IT checklist</Eyebrow>
          <h2 className="ion-heading">
            What your team
            <br />
            will want ready.
          </h2>
          <p className="ion-body">
            We work through this list together in week zero.
          </p>
        </Cell>
        <Cell md={8} className="ion-pad">
          <ul className="ion-feature-list">
            {itChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <TextLink href="/security">How Ion handles security</TextLink>
        </Cell>
      </LandingRow>

      <LandingRow tone="ion-inverse">
        <Cell md={8} className="ion-pad">
          <Eyebrow>A conversation, with your setup on the table</Eyebrow>
          <h2 className="ion-heading">
            Tell us what you
            <br />
            run today.
          </h2>
          <p className="ion-body">
            Google Workspace, Zoho, or something else entirely — describe your
            current environment and we will scope the move with you.
          </p>
          <Action href="/request-access">
            Talk to us about your migration
          </Action>
        </Cell>
        <Cell md={4} className="ion-pad ion-align-end">
          <p className="ion-body">
            Not ready to talk? Explore the workspace first.
          </p>
          <TextLink href="/demo">Try demo workspace</TextLink>
        </Cell>
      </LandingRow>
    </Site>
  )
}
