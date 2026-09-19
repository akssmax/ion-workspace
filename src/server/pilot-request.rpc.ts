import { createServerFn } from "@tanstack/react-start"
import { pilotAvailable, submitPilotRequest } from "./pilot-request.server"

export const getPilotAvailability = createServerFn({ method: "GET" }).handler(
  () => ({ available: pilotAvailable() })
)
export const requestPilotAccess = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(({ data }) => submitPilotRequest(data))
