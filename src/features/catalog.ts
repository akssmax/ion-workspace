/**
 * Feature catalog — registers every feature module's definition.
 *
 * Imported once by the app shell so the registry is populated before any
 * flag is read. Feature modules under `src/modules/**` call `defineFeature`
 * themselves; import them here as they land.
 */

import { defineFeature } from "./registry"

export const MAILBOXES_FEATURE = defineFeature({
  id: "mail.mailboxes",
  title: "Folder management",
  description: "Create, rename and delete custom mail folders.",
  defaultEnabled: true,
  apps: ["mail"],
})

export const LABELS_FEATURE = defineFeature({
  id: "mail.labels",
  title: "Labels",
  description:
    "Tag emails with labels. An email can carry several labels at once.",
  defaultEnabled: true,
  apps: ["mail"],
})

export const UPCOMING_ISLAND_FEATURE = defineFeature({
  id: "calendar.upcomingIsland",
  title: "Upcoming events island",
  description:
    "A Dynamic Island–style pill in the mail header for live and upcoming meetings.",
  defaultEnabled: true,
  apps: ["mail", "calendar"],
})
