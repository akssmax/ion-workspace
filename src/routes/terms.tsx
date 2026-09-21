import { createFileRoute } from "@tanstack/react-router"
import { LegalPage } from "@/components/marketing/legal-page"

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms — Ion" },
      {
        name: "description",
        content:
          "Terms for the Ion website and public demo. The managed pilot is covered by a separate agreement provided when you join.",
      },
    ],
  }),
})

function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title={
        <>
          Terms of
          <br />
          use.
        </>
      }
      updated="September 2026"
      intro="These terms govern use of the Ion website and its public demo. The managed pilot is covered by a separate agreement, provided when you join."
      sections={[
        {
          heading: "The website and demo",
          body: [
            "The website is provided as-is, for information. The demo runs on sample data: messages are simulated, never delivered, and reset when you refresh.",
            "Please do not enter confidential information into the demo — it is a public sample workspace, not a private one.",
          ],
        },
        {
          heading: "Acceptable use",
          body: ["Use the site and demo lawfully and kindly."],
          list: [
            "Do not attempt to disrupt or gain unauthorized access to the service",
            "Do not use the demo to store anything you would expect to keep",
            "Do not misrepresent your identity when requesting pilot access",
          ],
        },
        {
          heading: "Managed pilot",
          body: [
            "Access to the managed pilot is granted per accepted request and governed by an individual pilot agreement covering service scope, data handling, support, and pricing.",
            "Nothing on this website constitutes a binding service commitment.",
          ],
        },
        {
          heading: "Warranty and liability",
          body: [
            "The website and demo are provided without warranties of any kind, to the extent permitted by law. Ion is not liable for losses arising from their use.",
          ],
        },
        {
          heading: "Changes",
          body: [
            "These terms may change as the product does. Material changes will be highlighted on this page, and continued use of the site constitutes acceptance.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "Questions about these terms are welcome through the pilot access request page.",
          ],
        },
      ]}
    />
  )
}
