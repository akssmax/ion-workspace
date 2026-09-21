import { Badge } from "@/components/ui/badge"
import { Cell, LandingRow } from "@/components/landing/landing-grid"
import { Action, Eyebrow, Site } from "./site"
import { changelogEntries } from "./changelog-data"

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function ChangelogPage() {
  return (
    <Site>
      <LandingRow id="top" top>
        <Cell md={8} className="ion-pad ion-page-hero">
          <Eyebrow>Changelog</Eyebrow>
          <h1>
            What we
            <br />
            shipped.
          </h1>
          <p className="ion-body ion-readable">
            Reverse-chronological, dated, and specific. When something changes
            in the workspace, it lands here.
          </p>
          <p className="ion-small">
            Where things are headed, see the roadmap.
          </p>
        </Cell>
        <Cell md={4} className="ion-pad ion-align-end">
          <span className="ion-pilot-label">Managed Ion · Private pilot</span>
          <p className="ion-body">
            Built in the open, for the businesses using it.
          </p>
        </Cell>
      </LandingRow>

      <LandingRow id="entries">
        <Cell md={4} className="ion-pad">
          <Eyebrow>Shipped</Eyebrow>
          <h2 className="ion-heading">
            {changelogEntries.length} entries,
            <br />
            newest first.
          </h2>
        </Cell>
        <Cell md={8} className="ion-roadmap-list ion-pad">
          <ul>
            {changelogEntries.map((entry) => (
              <li key={entry.date}>
                <div className="ion-changelog-top">
                  <span className="ion-changelog-date">
                    {formatDate(entry.date)}
                  </span>
                  <Badge variant="outline">{entry.area}</Badge>
                </div>
                <h3>{entry.title}</h3>
                <p>{entry.description}</p>
              </li>
            ))}
          </ul>
        </Cell>
      </LandingRow>

      <LandingRow tone="ion-inverse">
        <Cell md={8} className="ion-pad">
          <Eyebrow>See where Ion is today</Eyebrow>
          <h2 className="ion-heading">Make yourself at home.</h2>
          <p className="ion-body">
            The demo lets you explore the current workspace with sample data.
          </p>
          <Action href="/demo">Try demo workspace</Action>
        </Cell>
        <Cell md={4} className="ion-pad ion-align-end">
          <Eyebrow>Have a requirement?</Eyebrow>
          <p className="ion-body">
            Tell us what matters to your team as we shape the managed pilot.
          </p>
          <a className="ion-text-link" href="/request-access">
            Request pilot access
          </a>
        </Cell>
      </LandingRow>
    </Site>
  )
}
