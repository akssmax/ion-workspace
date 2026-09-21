import { Cell, LandingRow } from "@/components/landing/landing-grid"
import { ProductPreview } from "@/components/landing/product-preview"
import { ProtocolDiagram } from "@/components/landing/landing-motion"
import { Action, Eyebrow, FinalCTA, Site, surfaces } from "./site"

export function ProductPage() {
  return (
    <Site>
      <LandingRow id="top" top>
        <Cell md={8} className="ion-pad ion-page-hero">
          <Eyebrow>The Ion workspace</Eyebrow>
          <h1>
            Four essentials.
            <br />
            One working day.
          </h1>
          <p className="ion-body ion-readable">
            From the first email to the final file, give everyday work a place
            of its own.
          </p>
          <Action href="/demo">Try demo workspace</Action>
        </Cell>
        <Cell md={4} className="ion-pad ion-product-index">
          {surfaces.map(({ id, name, icon: Icon }, i) => (
            <a key={id} href={`#${id}`}>
              <span>0{i + 1}</span>
              <Icon size={20} aria-hidden="true" />
              {name}
            </a>
          ))}
        </Cell>
      </LandingRow>
      {surfaces.map((s, i) => (
        <LandingRow key={s.id} id={s.id} tone={i % 2 ? "ion-soft" : undefined}>
          <Cell md={5} className="ion-pad">
            <Eyebrow>
              0{i + 1} / {s.name}
            </Eyebrow>
            <h2 className="ion-heading">{s.title}</h2>
            <p className="ion-body">{s.description}</p>
            <ul className="ion-feature-list">
              {s.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="ion-small">{s.example}</p>
          </Cell>
          <Cell md={7} className="ion-product-preview">
            <ProductPreview surface={s.id} />
          </Cell>
        </LandingRow>
      ))}
      <LandingRow id="protocol" tone="ion-inverse">
        <Cell md={6} className="ion-pad">
          <Eyebrow>An open foundation</Eyebrow>
          <h2 className="ion-heading">Connected by design.</h2>
          <p className="ion-body">
            Ion connects the workspace to its mail server with JMAP — an open
            internet standard for mail, calendars, and contacts, carried over
            JSON and HTTPS. The interface brings the essentials together;
            available capabilities depend on the connected server.
          </p>
          <a
            className="ion-text-link"
            href="https://jmap.io/"
            target="_blank"
            rel="noreferrer"
          >
            Learn about JMAP ↗
          </a>
        </Cell>
        <Cell md={6} className="ion-pad">
          <ProtocolDiagram />
        </Cell>
      </LandingRow>
      <LandingRow id="protocol-why">
        {[
          [
            "One open standard.",
            "JMAP (RFC 8620) is a published protocol for mail, calendars, and contacts — something your IT team can review, not reverse-engineer.",
          ],
          [
            "Sync without polling.",
            "Where IMAP waits to be asked, JMAP pushes state changes efficiently. Faster mail, gentler on slower connections.",
          ],
          [
            "No proprietary lock-in.",
            "Your data speaks a standard any compatible client or server can implement. The conversation stays open.",
          ],
        ].map(([title, copy]) => (
          <Cell md={4} key={title} className="ion-compare-card">
            <h3>{title}</h3>
            <p>{copy}</p>
          </Cell>
        ))}
      </LandingRow>
      <LandingRow id="keyboard" tone="ion-soft">
        <Cell md={6} className="ion-pad">
          <Eyebrow>Keep your momentum</Eyebrow>
          <h2 className="ion-heading">
            A few keys.
            <br />A little less friction.
          </h2>
          <p className="ion-body">
            Open the command palette to move between apps and find common
            actions. Compose and archive with familiar shortcuts.
          </p>
        </Cell>
        <Cell md={6} className="ion-shortcuts">
          {[
            ["⌘ / Ctrl + K", "Open the command palette"],
            ["C", "Compose a message"],
            ["E", "Archive the selected conversation"],
          ].map(([key, label]) => (
            <div key={key}>
              <kbd>{key}</kbd>
              <span>{label}</span>
            </div>
          ))}
        </Cell>
      </LandingRow>
      <FinalCTA />
    </Site>
  )
}
