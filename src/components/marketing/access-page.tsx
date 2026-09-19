import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { Cell, LandingRow } from "@/components/landing/landing-grid"
import { Eyebrow, Site, TextLink } from "./site"
import {
  getPilotAvailability,
  requestPilotAccess,
} from "@/server/pilot-request.rpc"
import {
  PILOT_MESSAGES,
  TEAM_SIZES,
  pilotRequestSchema,
} from "@/lib/pilot-request"

export function AccessPage({ source }: { source: "website" | "enterprise" }) {
  const [availability, setAvailability] = useState<boolean | null>(null)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState(false)
  const busy = useRef(false)
  const requestId = useRef("")
  const lastPayload = useRef("")
  const feedback = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let live = true
    void getPilotAvailability()
      .then((r) => {
        if (live) setAvailability(r.available)
      })
      .catch(() => {
        if (live) setAvailability(false)
      })
    return () => {
      live = false
    }
  }, [])
  useEffect(() => {
    if (message || success) feedback.current?.focus()
  }, [message, success])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current || !availability) return
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const payloadKey = JSON.stringify(values)
    if (payloadKey !== lastPayload.current) {
      requestId.current = crypto.randomUUID()
      lastPayload.current = payloadKey
    }
    const parsed = pilotRequestSchema.safeParse({
      ...values,
      source,
      requestId: requestId.current,
    })
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? PILOT_MESSAGES.invalid)
      return
    }
    busy.current = true
    setPending(true)
    setMessage("")
    try {
      const result = await requestPilotAccess({ data: parsed.data })
      if (result.ok) setSuccess(true)
      else setMessage(PILOT_MESSAGES[result.reason])
    } catch {
      setMessage(PILOT_MESSAGES.delivery)
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <Site>
      <LandingRow id="top" top>
        <Cell md={5} className="ion-pad ion-page-hero">
          <Eyebrow>Managed Ion · Private pilot</Eyebrow>
          <h1>
            Your business.
            <br />
            Your next step.
          </h1>
          <p className="ion-body">
            Tell us a little about your team and what you need from your
            workspace. We’ll use your request to assess whether the managed
            pilot is a fit.
          </p>
          <p className="ion-body">
            This is a request for access, not an account signup or a commitment
            to purchase. Pilot scope and availability are confirmed
            individually.
          </p>
          <TextLink href="/demo">Explore the demo first</TextLink>
        </Cell>
        <Cell md={7} className="ion-pad">
          {success ? (
            <div ref={feedback} tabIndex={-1} role="status">
              <Eyebrow>Request received</Eyebrow>
              <h2 className="ion-heading">
                Thanks for introducing
                <br />
                your business.
              </h2>
              <p className="ion-body">
                Your request has been delivered. We’ll review your details for
                pilot fit and use your work email to follow up. Access is not
                guaranteed.
              </p>
              <TextLink href="/demo">Keep exploring Ion</TextLink>
            </div>
          ) : (
            <form className="ion-form" onSubmit={submit} aria-busy={pending}>
              <h2 className="ion-heading">Request pilot access</h2>
              {availability === null && (
                <p className="ion-form-notice" role="status">
                  Checking request availability…
                </p>
              )}
              {availability === false && (
                <p className="ion-form-notice" role="status">
                  {PILOT_MESSAGES.unavailable}
                </p>
              )}
              <div className="ion-form-pair">
                <label>
                  Your name
                  <input
                    name="name"
                    required
                    maxLength={120}
                    autoComplete="name"
                  />
                </label>
                <label>
                  Work email
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                  />
                </label>
              </div>
              <div className="ion-form-pair">
                <label>
                  Company
                  <input
                    name="company"
                    required
                    maxLength={160}
                    autoComplete="organization"
                  />
                </label>
                <label>
                  Team size
                  <select name="teamSize" required defaultValue="">
                    <option value="" disabled>
                      Select team size
                    </option>
                    {TEAM_SIZES.map((size) => (
                      <option key={size}>{size}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                What should we know?{" "}
                <span className="ion-small" style={{ marginTop: 0 }}>
                  Optional — current tools, priorities, or requirements.
                </span>
                <textarea name="requirements" maxLength={3000} />
              </label>
              <div className="ion-honeypot" aria-hidden="true">
                <label>
                  Leave this blank
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <p className="ion-small" style={{ marginTop: 0 }}>
                We use these details to evaluate your request and respond about
                pilot access. Submitting this form does not subscribe you to
                marketing emails.
              </p>
              {message && (
                <div
                  ref={feedback}
                  tabIndex={-1}
                  role="alert"
                  className="ion-form-notice"
                >
                  {message}
                </div>
              )}
              <button
                type="submit"
                className="ion-button"
                disabled={pending || availability !== true}
              >
                {pending ? "Sending your request…" : "Request pilot access"}
                <span aria-hidden="true">↗</span>
              </button>
            </form>
          )}
        </Cell>
      </LandingRow>
    </Site>
  )
}
