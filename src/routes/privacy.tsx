import { createFileRoute } from "@tanstack/react-router"
import { LegalPage } from "@/components/marketing/legal-page"

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy — Ion" },
      {
        name: "description",
        content:
          "How the Ion website and managed pilot handle personal information: what we collect, how we use it, and what happens after the pilot.",
      },
    ],
  }),
})

function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title={
        <>
          Privacy,
          <br />
          plainly.
        </>
      }
      updated="September 2026"
      intro="This policy describes how the Ion website and managed pilot handle personal information. It is written to be read, not to fill a compliance checkbox."
      sections={[
        {
          heading: "What we collect",
          body: [
            "When you request pilot access, we collect the details you share with us — typically your name, work email, company, and a description of your needs.",
          ],
          list: [
            "Account and workspace content created during a managed pilot",
            "Basic operational data required to run the service",
            "Messages you send us directly",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "We use this information to operate the workspace, respond to your requests, and improve Ion. We do not sell personal information, and we do not run advertising.",
          ],
          list: [
            "Operating and securing the managed pilot",
            "Responding to access requests and questions",
            "Understanding how the workspace is used, in aggregate",
          ],
        },
        {
          heading: "The demo",
          body: [
            "The public demo runs entirely on sample data in your browser. Messages you compose there are simulated, never delivered, and reset when you refresh.",
          ],
        },
        {
          heading: "Hosting and access",
          body: [
            "The managed pilot runs on managed cloud infrastructure. Access is limited to the small team operating the pilot. Hosting regions and data-handling specifics are confirmed with you during evaluation.",
          ],
        },
        {
          heading: "Your data after the pilot",
          body: [
            "At the end of a pilot, we either export your data to you or delete it — as agreed with you in writing. Nothing is retained silently.",
          ],
        },
        {
          heading: "Questions",
          body: [
            "Raise anything, at any time, through the pilot access request page. A person answers.",
          ],
        },
      ]}
    />
  )
}
