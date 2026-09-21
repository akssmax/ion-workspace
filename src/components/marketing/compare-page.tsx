import { Cell, LandingRow } from "@/components/landing/landing-grid"
import { Eyebrow, FinalCTA, Site, TextLink } from "./site"

const dimensions = [
  "Mail — reading, composing, folders, labels, and search",
  "Calendar — the working day alongside your inbox",
  "Contacts — address books in the same workspace",
  "Files — folders, uploads, and downloads",
  "Protocol — JMAP (open standard) versus proprietary APIs",
  "Pricing model — pilot-shaped versus published tiers",
  "Migration path — import tooling and cutover",
]

const comparisons = [
  {
    name: "Google Workspace",
    line: "The mature suite with the deep ecosystem. We compare honestly — and say where it still wins.",
    href: "/compare/google-workspace",
  },
  {
    name: "Zoho",
    line: "Remarkable breadth and price across dozens of apps. We compare the essentials, fairly.",
    href: "/compare/zoho",
  },
]

export function ComparePage() {
  return (
    <Site>
      <LandingRow id="top" top>
        <Cell md={8} className="ion-pad ion-page-hero">
          <Eyebrow>Compare</Eyebrow>
          <h1>
            Ion, next to the
            <br />
            workspaces you know.
          </h1>
          <p className="ion-body ion-readable">
            Fair, specific comparisons of the essentials your business runs on.
            Written by us, so read with care — then check our claims against
            the demo.
          </p>
        </Cell>
        <Cell md={4} className="ion-pad ion-align-end">
          <span className="ion-pilot-label">Honest comparison</span>
          <p className="ion-body">
            No parity overclaims. Where the other tool is better, we say so.
          </p>
        </Cell>
      </LandingRow>

      <LandingRow tone="ion-soft">
        {comparisons.map((comparison) => (
          <Cell md={6} key={comparison.name}>
            <div className="ion-pad ion-benefit">
              <h2 className="ion-heading">{comparison.name}</h2>
              <p className="ion-body">{comparison.line}</p>
              <TextLink href={comparison.href}>
                Read the {comparison.name} comparison
              </TextLink>
            </div>
          </Cell>
        ))}
      </LandingRow>

      <LandingRow id="dimensions">
        <Cell md={4} className="ion-pad">
          <Eyebrow>What we compare</Eyebrow>
          <h2 className="ion-heading">
            The same seven
            <br />
            questions.
          </h2>
          <p className="ion-body">
            Any workspace you might run your business on should answer these.
          </p>
        </Cell>
        <Cell md={8} className="ion-pad">
          <ul className="ion-feature-list">
            {dimensions.map((dimension) => (
              <li key={dimension}>{dimension}</li>
            ))}
          </ul>
        </Cell>
      </LandingRow>

      <FinalCTA />
    </Site>
  )
}
