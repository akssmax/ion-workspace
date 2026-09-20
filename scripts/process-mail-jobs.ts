/** Run every minute from a trusted scheduler with DATABASE_URL and MAIL_JOB_ENCRYPTION_KEY. */
import { processDueMailJobs } from "../src/server/mail-jobs.server"
const count = await processDueMailJobs()
console.log(`Checked ${count} scheduled mail operations.`)
