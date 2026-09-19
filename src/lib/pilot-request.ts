import { z } from "zod"

export const TEAM_SIZES = [
  "1–10",
  "11–50",
  "51–200",
  "201–1,000",
  "1,001+",
] as const
export const pilotRequestSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120),
  email: z.string().trim().email("Enter a valid work email.").max(254),
  company: z.string().trim().min(1, "Enter your company name.").max(160),
  teamSize: z.enum(TEAM_SIZES),
  requirements: z.string().trim().max(3000).default(""),
  source: z.enum(["website", "enterprise"]).default("website"),
  website: z.string().max(500).default(""),
  requestId: z.string().uuid(),
})
export type PilotRequest = z.infer<typeof pilotRequestSchema>
export type PilotResult =
  | { ok: true; requestId: string }
  | { ok: false; reason: "unavailable" | "invalid" | "limited" | "delivery" }
export const PILOT_MESSAGES = {
  unavailable:
    "Pilot requests are temporarily unavailable. Please check back soon. You can still explore the demo.",
  invalid: "Please check your details and try again.",
  limited: "Too many requests. Please wait 15 minutes before trying again.",
  delivery:
    "We couldn’t confirm delivery. Your details are still here; please try again.",
} as const
