import { Cell, LandingRow } from "@/components/landing/landing-grid"
import { Action, Eyebrow, FinalCTA, Site, surfaces } from "./site"

const tiers = [
  {
    name: "Starter",
    for: "Directional · teams of roughly 5–20",
    copy: "The whole workspace, set up with you, and a team that answers when you write.",
    points: [
      "Mail, calendar, contacts, and files",
      "Guided, demo-first onboarding",
      "Standard support during the pilot",
    ],
    cta: "Request pilot access",
    href: "/request-access",
    secondary: true,
  },
  {
    name: "Business",
    for: "Directional · teams standardizing on Ion",
    copy: "Where most pilot conversations land. Migration help and support expectations, agreed in writing.",
    points: [
      "Everything in Starter",
      "Priority migration assistance",
      "Admin basics and identity planning",
      "Support expectations agreed with you",
    ],
    cta: "Talk to us",
    href: "/request-access",
    secondary: false,
  },
  {
    name: "Enterprise",
    for: "Directional · organizations of 200+ seats",
    copy: "Security review, residency, and service levels handled as a proper evaluation, not an afterthought.",
    points: [
      "Everything in Business",
      "Security review support",
      "Data residency and hosting discussion",
      "SLA defined together, before rollout",
    ],
    cta: "Enterprise evaluation",
    href: "/enterprise",
    secondary: true,
  },
]

const billingFaqs: [string, string][] = [
  [
    "How is Ion billed?",
    "The direction is per user, per month, but we confirm the model with you during the pilot rather than publishing rates we would soon change.",
  ],
  [
    "Is migration included?",
    "Migration is scoped with you. Smaller moves are often straightforward; larger ones are planned as a project with your IT team.",
  ],
  [
    "Is there a minimum seat count?",
    "No formal minimum. The pilot is designed for teams of roughly 5–50. Organizations of 200+ should start with the enterprise evaluation.",
  ],
  [
    "What happens after the pilot?",
    "Pricing and terms for continued service are agreed with you before the pilot ends. Nothing converts automatically.",
  ],
]

export function PricingPage() {
  return (
    <Site>
      <LandingRow id="top" top>
        <Cell md={8} className="ion-pad ion-page-hero">
          <Eyebrow>Pricing</Eyebrow>
          <h1>
            Pricing is part of
            <br />
            the pilot conversation.
          </h1>
          <p className="ion-body ion-readable">
            We do not publish standard rates. We shape the plan with each
            business during the managed pilot, so what you pay reflects what
            your team actually needs.
          </p>
          <p className="ion-small">
            The tiers below are directional. Final pricing is agreed before any
            commitment.
          </p>
        </Cell>
        <Cell md={4} className="ion-pad ion-align-end">
          <span className="ion-pilot-label">Managed Ion · Private pilot</span>
          <p className="ion-body">
            Every plan includes the whole workspace: mail, calendar, contacts,
            and files.
          </p>
        </Cell>
      </LandingRow>

      <LandingRow tone="ion-soft">
        {tiers.map((tier) => (
          <Cell md={4} key={tier.name}>
            <div className="ion-pad ion-benefit">
              <Eyebrow>{tier.name}</Eyebrow>
              <p className="ion-price">
                Talk to us
                <span>{tier.for}</span>
              </p>
              <p className="ion-body">{tier.copy}</p>
              <ul className="ion-feature-list">
                {tier.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <Action href={tier.href} secondary={tier.secondary}>
                {tier.cta}
              </Action>
            </div>
          </Cell>
        ))}
      </LandingRow>

      <LandingRow id="included" className="ion-editorial">
        <Cell className="ion-story-heading">
          <Eyebrow>Every tier</Eyebrow>
          <div className="ion-story-intro">
            <h2>
              The whole workspace,
              <br />
              in every plan.
            </h2>
            <p>
              No feature walls inside the essentials. If Ion has it, you get
              it.
            </p>
          </div>
        </Cell>
        {surfaces.map((surface) => {
          const Icon = surface.icon
          return (
            <Cell md={3} key={surface.id} className="ion-compare-card">
              <Icon size={20} aria-hidden="true" />
              <h3>{surface.name}</h3>
              <p>{surface.description}</p>
            </Cell>
          )
        })}
      </LandingRow>

      <LandingRow id="faq" tone="ion-soft">
        <Cell md={4} className="ion-pad">
          <Eyebrow>Billing questions</Eyebrow>
          <h2 className="ion-heading">
            A few things
            <br />
            about the bill.
          </h2>
        </Cell>
        <Cell md={8} className="ion-faq">
          {billingFaqs.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </Cell>
      </LandingRow>

      <FinalCTA />
    </Site>
  )
}
