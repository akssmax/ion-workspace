import { createFileRoute } from "@tanstack/react-router"
import { CompareDetailPage } from "@/components/marketing/compare-detail-page"
import type {
  CompareReason,
  CompareRow,
} from "@/components/marketing/compare-detail-page"

const rows: CompareRow[] = [
  {
    label: "Mail",
    ion: "Threaded conversations, folders, labels, and search — connected to the rest of the workspace.",
    other: "Gmail is excellent and battle-tested, with a deep ecosystem around it.",
  },
  {
    label: "Calendar",
    ion: "Month view and event details, kept alongside mail in the same working day.",
    other: "A mature calendar with broad third-party support.",
  },
  {
    label: "Contacts",
    ion: "Address books in the same workspace as mail and calendar.",
    other: "Directory-grade contacts, tied into the Google admin console.",
  },
  {
    label: "Files",
    ion: "Folders, uploads, and downloads, close to the conversation.",
    other: "Drive plus the Docs editor suite — far beyond simple file storage.",
  },
  {
    label: "Protocol",
    ion: "JMAP — an open internet standard (RFC 8620) for mail, calendars, and contacts.",
    other: "Proprietary APIs. IMAP exists but is limited and legacy.",
  },
  {
    label: "Pricing model",
    ion: "Shaped with you during the pilot — no published tier to outgrow.",
    other: "Published per-user tiers, with suite bundling.",
  },
  {
    label: "Migration path",
    ion: "IMAP import into JMAP storage, with a cutover plan your IT team reviews.",
    other: "Mature export and transfer tooling between Google tenants.",
  },
]

const reasons: CompareReason[] = [
  {
    title: "An open protocol.",
    detail:
      "JMAP is a published standard with efficient sync. Your workspace is not a proprietary API relationship you cannot leave.",
  },
  {
    title: "Essentials, not sprawl.",
    detail:
      "Mail, calendar, contacts, and files as one working day. If you need Docs and Sheets, keep using them alongside — or stay on Workspace.",
  },
  {
    title: "A pricing conversation.",
    detail:
      "Plans are shaped per business during the pilot instead of a published rate card you fit yourself into.",
  },
  {
    title: "A guided migration.",
    detail:
      "We move mail, contacts, calendars, and files with you, through a cutover window your IT team approves.",
  },
]

function GoogleWorkspaceComparePage() {
  return (
    <CompareDetailPage
      competitor="Google Workspace"
      title={
        <>
          Ion and
          <br />
          Google Workspace.
        </>
      }
      lead="A different shape of workspace: a focused, open-protocol alternative to the suite. Here is the honest picture."
      rows={rows}
      reasons={reasons}
      fairness="To be fair: Google Workspace is a mature suite with deep tooling and a vast ecosystem. If your business depends on Docs, Sheets, and tight third-party integrations, it may remain the right home. Ion is a focused, open-protocol alternative for teams who want the essentials done as one connected day."
    />
  )
}

export const Route = createFileRoute("/compare/google-workspace")({
  component: GoogleWorkspaceComparePage,
  head: () => ({
    meta: [
      { title: "Ion vs Google Workspace — Compare" },
      {
        name: "description",
        content:
          "An honest Ion vs Google Workspace comparison: mail, calendar, contacts, files, JMAP vs proprietary protocol, pricing model, and migration path.",
      },
    ],
  }),
})
