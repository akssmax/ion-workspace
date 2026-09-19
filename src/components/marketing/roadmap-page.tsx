import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Cell, LandingRow } from "@/components/landing/landing-grid"
import { Action, Eyebrow, Site } from "./site"
import { roadmapItems, roadmapStages } from "./roadmap-data"
import type { RoadmapStatus } from "./roadmap-data"

const stageNumber: Record<RoadmapStatus, string> = {
  available: "01",
  "in-progress": "02",
  planned: "03",
  exploring: "04",
}

export function RoadmapPage() {
  return (
    <Site>
      <LandingRow id="top" top>
        <Cell md={8} className="ion-pad ion-page-hero">
          <Eyebrow>Building Ion</Eyebrow>
          <h1>
            A clearer view
            <br />
            of what comes next.
          </h1>
          <p className="ion-body ion-readable">
            Follow the features available today, the work underway, and the
            directions we are exploring for Ion.
          </p>
          <p className="ion-small">
            Updated September 2026 · Plans may change as we learn.
          </p>
        </Cell>
        <Cell md={4} className="ion-pad ion-product-index ion-roadmap-index">
          {roadmapStages.map((stage) => (
            <a key={stage.id} href={`#${stage.id}`}>
              <span>{stageNumber[stage.id]}</span>
              {stage.label}
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          ))}
        </Cell>
      </LandingRow>

      {roadmapStages.map((stage, index) => {
        const items = roadmapItems.filter((item) => item.status === stage.id)
        return (
          <LandingRow
            key={stage.id}
            id={stage.id}
            tone={index % 2 === 1 ? "ion-soft" : undefined}
          >
            <Cell md={4} className="ion-pad ion-roadmap-intro">
              <Eyebrow>{stageNumber[stage.id]} / Roadmap</Eyebrow>
              <h2 className="ion-heading">{stage.label}</h2>
              <p className="ion-body">{stage.description}</p>
              <span className="ion-small">{items.length} areas</span>
            </Cell>
            <Cell md={8} className="ion-roadmap-list">
              <ul>
                {items.map((item) => (
                  <li key={item.title}>
                    <div className="ion-roadmap-item-top">
                      <Badge variant="outline">{item.area}</Badge>
                      <span className="ion-roadmap-status">{stage.label}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </li>
                ))}
              </ul>
            </Cell>
          </LandingRow>
        )
      })}

      <LandingRow tone="ion-inverse">
        <Cell md={8} className="ion-pad ion-roadmap-close">
          <Eyebrow>See where Ion is today</Eyebrow>
          <h2 className="ion-heading">Make yourself at home.</h2>
          <p className="ion-body">
            The demo lets you explore the current workspace with sample data.
          </p>
          <Action href="/demo">Try demo workspace</Action>
        </Cell>
        <Cell md={4} className="ion-pad ion-roadmap-close ion-roadmap-aside">
          <Eyebrow>Have a requirement?</Eyebrow>
          <p className="ion-body">
            Tell us what matters to your team as we shape the managed pilot.
          </p>
          <a className="ion-text-link" href="/request-access">
            Request pilot access <ArrowRight size={17} aria-hidden="true" />
          </a>
        </Cell>
      </LandingRow>
    </Site>
  )
}
