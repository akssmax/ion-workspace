import { Cell, LandingRow } from "./landing-grid"
import {
  Action,
  Benefits,
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
      <LandingRow>
        <Cell md={7} className="ion-pad">
          <Eyebrow>Built around the everyday</Eyebrow>
          <h2 className="ion-heading">
            The tools you reach for.
            <br />
            Now, within reach.
          </h2>
        </Cell>
        <Cell md={5} className="ion-pad ion-align-end">
          <p className="ion-body">
            Your day doesn’t happen in one app. Ion brings four essentials
            together, so you can move from one task to the next.
          </p>
          <TextLink href="/product">Explore the four apps</TextLink>
        </Cell>
      </LandingRow>
      <Benefits />
      <LandingRow id="how" tone="ion-inverse">
        <Cell md={6} className="ion-pad">
          <Eyebrow>Managed Ion · Private pilot</Eyebrow>
          <h2 className="ion-display">
            For your next
            <br />
            chapter of work.
          </h2>
          <p className="ion-body">
            A more connected working day starts with a closer look. We’re
            opening managed Ion to a limited pilot and learning with the
            businesses that join.
          </p>
          <TextLink href="/request-access">Request pilot access</TextLink>
        </Cell>
        <Cell md={6} className="ion-pilot-steps">
          {[
            [
              "01",
              "Make yourself at home",
              "Explore the sample workspace. Try the workflows your business uses every day.",
            ],
            [
              "02",
              "Tell us what you need",
              "Share your team size and requirements so we can evaluate the fit.",
            ],
            [
              "03",
              "Explore a pilot together",
              "If there’s a fit, discuss setup, scope, and next steps before getting started.",
            ],
          ].map(([n, t, c]) => (
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
      <LandingRow id="enterprise" tone="ion-soft">
        <Cell md={4} className="ion-pad">
          <Eyebrow>For larger organizations</Eyebrow>
          <p className="ion-large-number">
            A closer
            <br />
            look.
          </p>
        </Cell>
        <Cell md={8} className="ion-pad">
          <h2 className="ion-heading">
            Your requirements deserve
            <br />a proper conversation.
          </h2>
          <p className="ion-body ion-readable">
            Review how Ion is built, what’s available today, and the questions
            to bring to an enterprise evaluation.
          </p>
          <TextLink href="/enterprise">
            Explore Ion for your organization
          </TextLink>
        </Cell>
      </LandingRow>
      <FAQ />
      <FinalCTA />
    </Site>
  )
}
