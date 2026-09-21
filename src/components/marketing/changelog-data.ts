export interface ChangelogEntry {
  /** ISO date, newest first. */
  date: string
  area: "Mail" | "Workspace" | "Platform" | "Site"
  title: string
  description: string
}

export const changelogEntries: ChangelogEntry[] = [
  {
    date: "2026-09-08",
    area: "Site",
    title: "Public roadmap",
    description:
      "The Ion roadmap is now public — available, in progress, planned, and exploring, updated as we learn.",
  },
  {
    date: "2026-08-24",
    area: "Mail",
    title: "Personal mail controls",
    description:
      "Reading layouts, compose preferences, identities, templates, and account-aware settings.",
  },
  {
    date: "2026-08-03",
    area: "Workspace",
    title: "One connected workspace",
    description:
      "Move between mail, calendar, contacts, and files from one familiar interface.",
  },
  {
    date: "2026-07-12",
    area: "Mail",
    title: "Everyday mail",
    description:
      "Threaded reading, composing, drafts, search, folders, labels, and bulk actions.",
  },
  {
    date: "2026-06-15",
    area: "Site",
    title: "Interactive demo",
    description:
      "The demo workspace opened to everyone — sample data, no account, changes reset on refresh.",
  },
]
