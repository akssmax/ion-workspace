import { WhyIon } from "@/components/marketing/why-ion"
import { Cell, LandingRow } from "./landing-grid"
import {
  Action,
  DemoPreview,
  Eyebrow,
  FAQ,
  FinalCTA,
  Site,
  TextLink,
} from "@/components/marketing/site"

export function LandingPage() {
  return (
    <Site>
      <LandingRow id="top" atmosphere tall top>
        <Cell md={7} className="ion-pad ion-hero-title">
          <Eyebrow>A workspace for your business</Eyebrow>
          <h1>
            Business email.
            <br />
            Your working day,
            <br />
            together.
          </h1>
          <div className="ion-actions">
            <Action href="/demo">Try demo workspace</Action>
            <Action href="/request-access" secondary>
              Request pilot access
            </Action>
          </div>
          <p className="ion-small">
            No account needed for the demo. Uses sample data.
          </p>
        </Cell>
        <Cell md={5} className="ion-pad ion-hero-copy">
          <span className="ion-pilot-label">
            Managed workspace · Private pilot
          </span>
          <p>
            Bring email, calendars, contacts, and files into one connected
            workspace.
          </p>
          <p className="ion-body">
            Explore Ion with sample data, then request access to our managed
            business pilot.
          </p>
          <TextLink href="/product">Meet your workspace</TextLink>
        </Cell>
      </LandingRow>
      <LandingRow id="product" tone="ion-soft">
        <Cell>
          <DemoPreview />
        </Cell>
      </LandingRow>
      <WhyIon />
      <LandingRow id="how" className="ion-editorial">
        <Cell className="ion-story-heading">
          <Eyebrow>Managed Ion · Private pilot</Eyebrow>
          <div className="ion-story-intro">
            <h2>
              Start with a look.
              <br />
              Build from there.
            </h2>
            <div>
              <p>
                Explore the workspace first. Then tell us what your business
                needs, so we can shape the right pilot together.
              </p>
              <TextLink href="/request-access">Request pilot access</TextLink>
            </div>
          </div>
        </Cell>
        {[
          [
            "01",
            "Try the workspace",
            "Explore real workflows with sample data. No account or setup needed.",
          ],
          [
            "02",
            "Bring your requirements",
            "Share your team size, current setup, and the work you want to improve.",
          ],
          [
            "03",
            "Define the pilot",
            "If there’s a fit, agree on scope, setup, and next steps before getting started.",
          ],
        ].map(([number, title, copy]) => (
          <Cell md={4} className="ion-pilot-card" key={number}>
            <span>{number}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </Cell>
        ))}
      </LandingRow>
      <LandingRow
        id="enterprise"
        tone="ion-inverse"
        className="ion-enterprise-band"
      >
        <Cell md={7} className="ion-pad">
          <Eyebrow>For larger organizations</Eyebrow>
          <h2 className="ion-heading">
            A closer look.
            <br />A proper conversation.
          </h2>
        </Cell>
        <Cell md={5} className="ion-pad ion-value-copy">
          <p className="ion-body">
            Review the architecture, current capabilities, and requirements to
            discuss with your IT team.
          </p>
          <TextLink href="/enterprise">
            Evaluate Ion for your organization
          </TextLink>
        </Cell>
      </LandingRow>
      <FAQ />
      <FinalCTA />
    </Site>
  )
}
