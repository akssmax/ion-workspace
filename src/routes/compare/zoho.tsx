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
    other: "Zoho Mail is a capable, inexpensive suite with IMAP and POP support.",
  },
  {
    label: "Calendar",
    ion: "Month view and event details, kept alongside mail in the same working day.",
    other: "Solid calendar, part of the broader Zoho suite.",
  },
  {
    label: "Contacts",
    ion: "Address books in the same workspace as mail and calendar.",
    other: "Contacts managed through the Zoho apps ecosystem.",
  },
  {
    label: "Files",
    ion: "Folders, uploads, and downloads, close to the conversation.",
    other: "WorkDrive, with its own editor suite attached.",
  },
  {
    label: "Protocol",
    ion: "JMAP — an open internet standard (RFC 8620) for mail, calendars, and contacts.",
    other: "Proprietary APIs; IMAP support on some plans.",
  },
  {
    label: "Pricing model",
    ion: "Shaped with you during the pilot — no published tier to outgrow.",
    other: "Aggressive published pricing, often bundled across the suite.",
  },
  {
    label: "Migration path",
    ion: "IMAP import into JMAP storage, with a cutover plan your IT team reviews.",
    other: "Built-in migration tools for mail from major providers.",
  },
]

const reasons: CompareReason[] = [
  {
    title: "One connected day.",
    detail:
      "Mail, calendar, contacts, and files share one interface and one navigation, rather than a bundle of separately designed apps.",
  },
  {
    title: "An open foundation.",
    detail:
      "JMAP gives your IT team a standard protocol to evaluate, not a vendor API to live with.",
  },
  {
    title: "A team you reach.",
    detail:
      "The pilot is run by the people building Ion. Support is a conversation, not a ticket queue tier.",
  },
  {
    title: "Focused scope.",
    detail:
      "Ion does four things well. If you rely on Zoho's fifty-app breadth, that breadth is a real reason to stay.",
  },
]

function ZohoComparePage() {
  return (
    <CompareDetailPage
      competitor="Zoho"
      title={
        <>
          Ion and
          <br />
          Zoho.
        </>
      }
      lead="Zoho competes on breadth and price. We compete on a focused working day with an open protocol underneath. Here is the honest picture."
      rows={rows}
      reasons={reasons}
      fairness="To be fair: Zoho offers remarkable breadth and price across dozens of apps, and businesses standardized on that ecosystem have good reasons to stay. Ion is for teams who want a smaller, focused workspace with an open standard at its foundation."
    />
  )
}

export const Route = createFileRoute("/compare/zoho")({
  component: ZohoComparePage,
  head: () => ({
    meta: [
      { title: "Ion vs Zoho — Compare" },
      {
        name: "description",
        content:
          "An honest Ion vs Zoho comparison: mail, calendar, contacts, files, JMAP vs proprietary protocol, pricing model, and migration path.",
      },
    ],
  }),
})
