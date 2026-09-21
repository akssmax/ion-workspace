import type { ReactNode } from "react"
import { Cell, LandingRow } from "@/components/landing/landing-grid"
import { Eyebrow, Site, TextLink } from "./site"

export interface LegalSection {
  heading: string
  body?: string[]
  list?: string[]
}

export function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  sections,
  link = { href: "/request-access", label: "Questions? Ask us directly" },
}: {
  eyebrow: string
  title: ReactNode
  updated: string
  intro: string
  sections: LegalSection[]
  link?: { href: string; label: string }
}) {
  return (
    <Site>
      <LandingRow id="top" top>
        <Cell md={8} className="ion-pad ion-page-hero">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1>{title}</h1>
          <p className="ion-body ion-readable">{intro}</p>
          <p className="ion-small">Last updated {updated}</p>
        </Cell>
      </LandingRow>
      <LandingRow>
        <Cell md={8} className="ion-pad">
          <div className="ion-legal-body">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.body?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.list && (
                  <ul>
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </Cell>
        <Cell md={4} className="ion-pad ion-align-end">
          <TextLink href={link.href}>{link.label}</TextLink>
        </Cell>
      </LandingRow>
    </Site>
  )
}
