import { Cell, LandingRow } from "@/components/landing/landing-grid"
import { Eyebrow, Site, TextLink } from "./site"

const compliance: [string, string, string][] = [
  [
    "In progress",
    "GDPR alignment",
    "Privacy policy published; data processing agreements prepared during pilot onboarding.",
  ],
  [
    "Planned",
    "SOC 2",
    "Not yet certified. We will state it plainly here when that changes.",
  ],
  [
    "Planned",
    "Independent audit",
    "An external audit is planned as the managed service grows past the pilot.",
  ],
]

export function SecurityPage() {
  return (
    <Site>
      <LandingRow id="top" top>
        <Cell md={8} className="ion-pad ion-page-hero">
          <Eyebrow>Trust</Eyebrow>
          <h1>
            Built for
            <br />
            business trust.
          </h1>
          <p className="ion-body ion-readable">
            A workspace for business has to earn the right to hold your working
            day. Here is what Ion does today, and what is still being
            formalized — stated plainly.
          </p>
          <p className="ion-small">Status accurate as of September 2026.</p>
        </Cell>
        <Cell md={4} className="ion-pad ion-align-end">
          <span className="ion-pilot-label">Managed Ion · Private pilot</span>
          <p className="ion-body">
            No certification theatre. What is done, what is not, and who to
            ask.
          </p>
        </Cell>
      </LandingRow>

      <LandingRow id="encryption">
        <Cell md={6} className="ion-pad">
          <Eyebrow>Encryption · In transit</Eyebrow>
          <h2 className="ion-heading">Encrypted on the move.</h2>
          <p className="ion-body">
            Every connection between your browser, the Ion service, and the
            JMAP server runs over TLS. No plain-text hops for your working day.
          </p>
        </Cell>
        <Cell md={6} className="ion-pad ion-soft">
          <Eyebrow>Encryption · At rest</Eyebrow>
          <h2 className="ion-heading">Encrypted at rest.</h2>
          <p className="ion-body">
            Managed pilot storage is encrypted at rest. Key management and any
            customer-key requirements your organization has are covered during
            the evaluation conversation.
          </p>
        </Cell>
      </LandingRow>

      <LandingRow id="hosting" tone="ion-soft">
        <Cell md={6} className="ion-pad">
          <Eyebrow>Hosting & residency</Eyebrow>
          <h2 className="ion-heading">
            Where Ion
            <br />
            runs.
          </h2>
          <p className="ion-body">
            The managed pilot runs on managed cloud infrastructure. The hosting
            region is confirmed during evaluation — if your business requires a
            specific region, raise it in the pilot conversation and we will
            answer with specifics, not assurances.
          </p>
        </Cell>
        <Cell md={6} className="ion-pad">
          <Eyebrow>Backups & recovery</Eyebrow>
          <h2 className="ion-heading">
            Kept, and
            <br />
            proven.
          </h2>
          <p className="ion-body">
            The managed pilot includes routine backups of the service. Recovery
            objectives and restore drills are agreed per deployment during the
            pilot, so your team knows exactly what is protected and how fast it
            comes back.
          </p>
        </Cell>
      </LandingRow>

      <LandingRow id="compliance">
        <Cell md={4} className="ion-pad">
          <Eyebrow>Compliance status</Eyebrow>
          <h2 className="ion-heading">
            Stated as
            <br />
            it is.
          </h2>
          <p className="ion-body">
            We would rather show the honest state of the work than borrow
            credibility we have not earned yet.
          </p>
        </Cell>
        <Cell md={8} className="ion-roadmap-list ion-pad">
          <ul>
            {compliance.map(([status, title, copy]) => (
              <li key={title}>
                <div className="ion-changelog-top">
                  <span className="ion-roadmap-status">{status}</span>
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ul>
        </Cell>
      </LandingRow>

      <LandingRow id="service" tone="ion-soft">
        <Cell md={6} className="ion-pad">
          <Eyebrow>Uptime & SLA</Eyebrow>
          <h2 className="ion-heading">
            No formal SLA yet.
          </h2>
          <p className="ion-body">
            Service levels are defined with you during the pilot and put in
            writing before rollout. We would rather commit to numbers we can
            keep than publish a tier we cannot stand behind.
          </p>
        </Cell>
        <Cell md={6} className="ion-pad">
          <Eyebrow>Sub-processors</Eyebrow>
          <h2 className="ion-heading">
            A short list,
            <br />
            documented.
          </h2>
          <p className="ion-body">
            The pilot keeps its stack deliberately short. A documented
            sub-processor list is provided during enterprise evaluation.
          </p>
        </Cell>
      </LandingRow>

      <LandingRow tone="ion-inverse">
        <Cell md={8} className="ion-pad">
          <Eyebrow>Evaluate us</Eyebrow>
          <h2 className="ion-heading">
            Bring your
            <br />
            checklist.
          </h2>
          <p className="ion-body">
            Security, migration, and service levels are exactly what the
            enterprise evaluation exists for.
          </p>
          <TextLink href="/enterprise">Enterprise evaluation</TextLink>
        </Cell>
        <Cell md={4} className="ion-pad ion-align-end">
          <p className="ion-body">Smaller team? Start with the pilot.</p>
          <TextLink href="/request-access">Request pilot access</TextLink>
        </Cell>
      </LandingRow>
    </Site>
  )
}
