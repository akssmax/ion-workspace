import { createServerFn } from "@tanstack/react-start"
import { requireSession } from "./session.server"
import {
  addFeed,
  listFeeds,
  refreshFeed,
  removeFeed,
} from "./calendar-feeds.server"
export const getCalendarFeeds = createServerFn({ method: "GET" }).handler(
  async () => listFeeds(await requireSession())
)
export const createCalendarFeed = createServerFn({ method: "POST" })
  .validator((data: { name: string; url: string; color?: string }) => data)
  .handler(async ({ data }) => addFeed(await requireSession(), data))
export const deleteCalendarFeed = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data }) => removeFeed(await requireSession(), data))
export const refreshCalendarFeed = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data }) => refreshFeed(data, await requireSession()))
