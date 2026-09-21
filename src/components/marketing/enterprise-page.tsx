import { Cell, LandingRow } from "@/components/landing/landing-grid"
import { ProtocolDiagram } from "@/components/landing/landing-motion"
import { Action, Eyebrow, Site, TextLink } from "./site"

export function EnterprisePage() {
  return (
    <Site>
      <LandingRow id="top" top>
        <Cell md={8} className="ion-pad ion-page-hero">
          <Eyebrow>Enterprise evaluation</Eyebrow>
          <h1>
            A clear view.
            <br />
            An informed decision.
          </h1>
          <p className="ion-body ion-readable">
            Explore the workspace, understand the architecture, and bring your
            organization’s requirements to a managed pilot conversation.
          </p>
          <div className="ion-actions">
            <Action href="/request-access?source=enterprise">
              Discuss pilot access
            </Action>
            <Action href="/demo" secondary>
              Try demo workspace
            </Action>
          </div>
        </Cell>
        <Cell md={4} className="ion-pad ion-align-end">
          <span className="ion-pilot-label">Private pilot</span>
          <p className="ion-body">
            Ion’s managed service is being evaluated with early businesses.
            Enterprise suitability is assessed case by case.
          </p>
        </Cell>
      </LandingRow>
      <LandingRow>
        <Cell md={6} className="ion-pad">
          <Eyebrow>Explore today</Eyebrow>
          <h2 className="ion-heading">Start with the workspace.</h2>
          <ul className="ion-feature-list">
            <li>Email conversations, folders, search, and composition</li>
            <li>Month calendar and event creation</li>
            <li>Contacts, address books, and files</li>
            <li>Keyboard navigation and a command palette</li>
            <li>An interactive demo with isolated sample data</li>
          </ul>
          <TextLink href="/product">See the product in detail</TextLink>
        </Cell>
        <Cell md={6} className="ion-pad ion-soft">
          <Eyebrow>Discuss during evaluation</Eyebrow>
          <h2 className="ion-heading">Bring your requirements.</h2>
          <p className="ion-body">
            Identity and SSO, administration, migration, data location,
            retention, security review, support, and service levels all need an
            explicit discussion.
          </p>
          <p className="ion-body">
            These are evaluation topics, not included feature commitments. We do
            not currently publish enterprise certifications, standard SLAs, or
            enterprise pricing.
          </p>
          <div className="ion-enterprise-links">
            <TextLink href="/security">Security &amp; trust overview</TextLink>
            <TextLink href="/migration">Migration approach</TextLink>
          </div>
        </Cell>
      </LandingRow>
      <LandingRow id="architecture" tone="ion-inverse">
        <Cell md={6} className="ion-pad">
          <Eyebrow>Architecture</Eyebrow>
          <h2 className="ion-heading">
            The interface.
            <br />
            The connection.
            <br />
            The server.
          </h2>
          <p className="ion-body">
            Ion’s web interface connects through a server-side boundary to a
            configured JMAP server. Authentication credentials stay on the
            server. The managed pilot’s hosting, operational responsibilities,
            and available capabilities are confirmed during evaluation.
          </p>
          <TextLink href="/product#protocol">
            The protocol, explained in the product
          </TextLink>
        </Cell>
        <Cell md={6} className="ion-pad">
          <ProtocolDiagram />
        </Cell>
      </LandingRow>
      <LandingRow>
        {[
          [
            "01",
            "Evaluate",
            "Use the sample workspace to assess the everyday experience.",
          ],
          [
            "02",
            "Define",
            "Share your team size, existing environment, and essential requirements.",
          ],
          [
            "03",
            "Agree",
            "Confirm pilot scope and responsibilities before any rollout.",
          ],
        ].map(([n, t, c]) => (
          <Cell key={n} md={4} className="ion-pad">
            <span className="ion-index">{n}</span>
            <h2 className="ion-heading">{t}</h2>
            <p className="ion-body">{c}</p>
          </Cell>
        ))}
      </LandingRow>
      <LandingRow id="get-started" tone="ion-soft">
        <Cell className="ion-pad">
          <Eyebrow>A conversation, with context</Eyebrow>
          <h2 className="ion-display">
            Tell us what good
            <br />
            looks like for your team.
          </h2>
          <p className="ion-body">
            Share the requirements that matter. We’ll use them to assess pilot
            fit.
          </p>
          <Action href="/request-access?source=enterprise">
            Request pilot access
          </Action>
        </Cell>
      </LandingRow>
    </Site>
  )
}
