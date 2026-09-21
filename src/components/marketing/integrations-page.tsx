import { Badge } from "@/components/ui/badge"
import { Cell, LandingRow } from "@/components/landing/landing-grid"
import { Eyebrow, FinalCTA, Site, TextLink } from "./site"

const available = [
  {
    area: "Workspace",
    title: "The four essentials, connected",
    description:
      "Mail, calendar, contacts, and files share one interface, one navigation, and one command palette.",
  },
  {
    area: "Platform",
    title: "JMAP server connection",
    description:
      "The workspace connects to a compatible JMAP server — the same open protocol your IT team can evaluate.",
  },
  {
    area: "Workspace",
    title: "Keyboard-first control",
    description:
      "A command palette and familiar shortcuts across every surface of the workspace.",
  },
]

const coming = [
  {
    area: "Identity",
    title: "SSO & SAML",
    description:
      "Single sign-on through your identity provider, so Ion joins your existing access controls.",
    status: "Planned",
  },
  {
    area: "Calendar",
    title: "Two-way external sync",
    description: "Keep external calendars in step with the Ion calendar.",
    status: "Planned",
  },
  {
    area: "Messaging",
    title: "Slack",
    description: "Notifications and actions where your team already talks.",
    status: "Planned",
  },
  {
    area: "Sales",
    title: "CRM",
    description:
      "Bring customer details into the conversation view. Which CRMs come first? You tell us.",
    status: "Exploring",
  },
]

export function IntegrationsPage() {
  return (
    <Site>
      <LandingRow id="top" top>
        <Cell md={8} className="ion-pad ion-page-hero">
          <Eyebrow>Integrations</Eyebrow>
          <h1>
            What Ion
            <br />
            connects to.
          </h1>
          <p className="ion-body ion-readable">
            Ion is young. Its integrations story starts with the open protocol
            it is built on — and grows in the order the businesses using it ask
            for.
          </p>
        </Cell>
        <Cell md={4} className="ion-pad ion-align-end">
          <span className="ion-pilot-label">Managed Ion · Private pilot</span>
          <p className="ion-body">
            No app store yet. A short list, stated honestly.
          </p>
        </Cell>
      </LandingRow>

      <LandingRow id="available">
        <Cell md={4} className="ion-pad">
          <Eyebrow>Available now</Eyebrow>
          <h2 className="ion-heading">
            Inside the
            <br />
            workspace.
          </h2>
          <p className="ion-body">
            The connections Ion is built on, available in the demo today.
          </p>
        </Cell>
        <Cell md={8} className="ion-roadmap-list ion-pad">
          <ul>
            {available.map((item) => (
              <li key={item.title}>
                <div className="ion-changelog-top">
                  <Badge variant="outline">{item.area}</Badge>
                  <span className="ion-roadmap-status">Available</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </li>
            ))}
          </ul>
        </Cell>
      </LandingRow>

      <LandingRow id="coming" tone="ion-soft">
        <Cell md={4} className="ion-pad">
          <Eyebrow>Coming soon</Eyebrow>
          <h2 className="ion-heading">
            On the
            <br />
            way.
          </h2>
          <p className="ion-body">
            Tracked on the roadmap. Planned means scheduled; exploring means we
            are listening.
          </p>
          <TextLink href="/roadmap">See the roadmap</TextLink>
        </Cell>
        <Cell md={8} className="ion-roadmap-list ion-pad">
          <ul>
            {coming.map((item) => (
              <li key={item.title}>
                <div className="ion-changelog-top">
                  <Badge variant="outline">{item.area}</Badge>
                  <span className="ion-roadmap-status">{item.status}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </li>
            ))}
          </ul>
        </Cell>
      </LandingRow>

      <LandingRow id="request">
        <Cell md={8} className="ion-pad">
          <Eyebrow>Missing something?</Eyebrow>
          <h2 className="ion-heading">
            Request an integration.
          </h2>
          <p className="ion-body">
            Tell us what your team needs first. Requests shape the order we
            build in.
          </p>
          <TextLink href="/request-access">Tell us what to build</TextLink>
        </Cell>
      </LandingRow>

      <FinalCTA />
    </Site>
  )
}
