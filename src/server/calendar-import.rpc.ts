import { createServerFn } from "@tanstack/react-start"
import { requireSession } from "./session.server"
import { parseCalendarFile } from "@/lib/ical-import"
export const parseCalendarUpload = createServerFn({ method: "POST" })
  .validator((contents: string) => contents)
  .handler(async ({ data }) => {
    await requireSession()
    return parseCalendarFile(data)
  })
