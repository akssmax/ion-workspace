export type RoadmapStatus =
  "available" | "in-progress" | "planned" | "exploring"

export interface RoadmapItem {
  title: string
  area: "Mail" | "Workspace" | "Platform"
  description: string
  status: RoadmapStatus
}

/** Public product view of the engineering roadmap in docs/email-roadmap.md. */
export const roadmapItems: RoadmapItem[] = [
  {
    title: "Everyday mail",
    area: "Mail",
    description:
      "Threaded reading, composing, drafts, search, folders, labels, and bulk actions.",
    status: "available",
  },
  {
    title: "One connected workspace",
    area: "Workspace",
    description:
      "Move between mail, calendar, contacts, and files from one familiar interface.",
    status: "available",
  },
  {
    title: "Personal mail controls",
    area: "Mail",
    description:
      "Reading layouts, compose preferences, identities, templates, and account-aware settings.",
    status: "available",
  },
  {
    title: "Stalwart account readiness",
    area: "Platform",
    description:
      "Verify sign-in, account capabilities, permissions, and mail operations with real Stalwart accounts.",
    status: "in-progress",
  },
  {
    title: "Reliable conversations",
    area: "Mail",
    description:
      "Polish replies, draft recovery, attachments, and safe message rendering.",
    status: "in-progress",
  },
  {
    title: "Works on every screen",
    area: "Workspace",
    description:
      "Refine small-screen navigation, reading panes, keyboard flow, and accessibility.",
    status: "in-progress",
  },
  {
    title: "Send and follow up later",
    area: "Mail",
    description:
      "Scheduled sending, undo send, snooze, reminders, and an outbox with retry controls.",
    status: "planned",
  },
  {
    title: "From email to action",
    area: "Workspace",
    description:
      "Turn conversations into tasks or calendar events and see related context together.",
    status: "planned",
  },
  {
    title: "Offline and live sync",
    area: "Platform",
    description:
      "Cached reading, queued actions, and reconciliation after the connection returns.",
    status: "planned",
  },
  {
    title: "Shared inboxes",
    area: "Workspace",
    description:
      "Assignments, notes, status, and collision awareness for teams handling mail together.",
    status: "exploring",
  },
  {
    title: "Helpful assistance",
    area: "Mail",
    description:
      "User-reviewed summaries and editable suggestions after the core workflows are established.",
    status: "exploring",
  },
]

export const roadmapStages: {
  id: RoadmapStatus
  label: string
  description: string
}[] = [
  {
    id: "available",
    label: "Available today",
    description: "Features you can explore in the demo workspace now.",
  },
  {
    id: "in-progress",
    label: "In progress",
    description: "The areas we are actively refining and validating.",
  },
  {
    id: "planned",
    label: "Planned",
    description: "The next capabilities on our product roadmap.",
  },
  {
    id: "exploring",
    label: "Exploring",
    description: "Ideas we are evaluating as the workspace grows.",
  },
]
