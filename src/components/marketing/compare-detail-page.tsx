import type { ReactNode } from "react"
import { Cell, LandingRow } from "@/components/landing/landing-grid"
import { Action, Eyebrow, FinalCTA, Site } from "./site"

export interface CompareRow {
  label: string
  ion: string
  other: string
}

export interface CompareReason {
  title: string
  detail: string
}

export function CompareDetailPage({
  competitor,
  title,
  lead,
  rows,
  reasons,
  fairness,
}: {
  competitor: string
  title: ReactNode
  lead: string
  rows: CompareRow[]
  reasons: CompareReason[]
  fairness: string
}) {
  return (
    <Site>
      <LandingRow id="top" top>
        <Cell md={8} className="ion-pad ion-page-hero">
          <Eyebrow>Compare</Eyebrow>
          <h1>{title}</h1>
          <p className="ion-body ion-readable">{lead}</p>
          <div className="ion-actions">
            <Action href="/demo">Try demo workspace</Action>
          </div>
        </Cell>
        <Cell md={4} className="ion-pad ion-align-end">
          <span className="ion-pilot-label">Honest comparison</span>
          <p className="ion-body">
            We name what {competitor} does well. The point is a fair picture,
            not a sales pitch.
          </p>
        </Cell>
      </LandingRow>

      <LandingRow id="table">
        <Cell md={4} className="ion-pad">
          <Eyebrow>Side by side</Eyebrow>
          <h2 className="ion-heading">
            The essentials,
            <br />
            compared.
          </h2>
          <p className="ion-body">
            The same questions we would want answered for any workspace we ran
            our business on.
          </p>
        </Cell>
        <Cell md={8} className="ion-pad">
          <div className="ion-table-wrap">
            <table className="ion-table">
              <thead>
                <tr>
                  <th scope="col">Area</th>
                  <th scope="col">Ion</th>
                  <th scope="col">{competitor}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td className="ion-col-ion">{row.ion}</td>
                    <td>{row.other}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Cell>
      </LandingRow>

      <LandingRow id="why-switch" tone="ion-soft" className="ion-editorial">
        <Cell className="ion-story-heading">
          <Eyebrow>Why teams switch</Eyebrow>
          <div className="ion-story-intro">
            <h2>
              Reasons, without
              <br />
              the sales pitch.
            </h2>
            <p>
              Why teams consider Ion over {competitor} — and, just as honestly,
              reasons to stay put.
            </p>
          </div>
        </Cell>
        {reasons.map((reason) => (
          <Cell md={3} key={reason.title} className="ion-compare-card">
            <h3>{reason.title}</h3>
            <p>{reason.detail}</p>
          </Cell>
        ))}
        <Cell md={12} className="ion-comparison-note">
          {fairness}
        </Cell>
      </LandingRow>

      <FinalCTA />
    </Site>
  )
}
