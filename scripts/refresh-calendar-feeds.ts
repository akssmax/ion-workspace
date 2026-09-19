/** Run hourly from a trusted scheduler with DATABASE_URL and CALENDAR_FEED_ENCRYPTION_KEY. */
import { refreshDueFeeds } from "../src/server/calendar-feeds.server"
const count = await refreshDueFeeds()
console.log(`Checked ${count} calendar feeds.`)
