/**
 * Runtime validation for the JMAP wire format (RFC 8620 §3.3).
 *
 * Guards against sending a structurally invalid `Request` object — a common
 * cause of an opaque HTTP 400 `urn:ietf:params:jmap:error:notRequest` from the
 * server. Failing locally surfaces a precise, actionable error instead.
 */

import { AppError } from "../types/error"

export interface JmapWireRequest {
  using: string[]
  methodCalls: [string, Record<string, unknown>, string][]
  createdIds?: Record<string, string>
}

function invalid(message: string): AppError {
  return new AppError("invalidArguments", message)
}

/**
 * Validate a serialized JMAP request body. Throws `AppError` when the body
 * does not match the required shape; otherwise narrows its type.
 */
export function assertJmapRequest(
  body: unknown
): asserts body is JmapWireRequest {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw invalid("JMAP request body must be an object.")
  }

  const { using, methodCalls, createdIds } = body as Record<string, unknown>

  // `using` must be a non-empty array of capability URNs.
  if (
    !Array.isArray(using) ||
    using.length === 0 ||
    !using.every((entry) => typeof entry === "string" && entry.length > 0)
  ) {
    throw invalid(
      "JMAP request 'using' must be a non-empty array of capability strings."
    )
  }

  // `methodCalls` must be a non-empty array of [name, args, callId] triples.
  if (!Array.isArray(methodCalls) || methodCalls.length === 0) {
    throw invalid("JMAP request 'methodCalls' must be a non-empty array.")
  }
  methodCalls.forEach((call, index) => {
    if (!Array.isArray(call) || call.length !== 3) {
      throw invalid(
        `JMAP method call at index ${index} must be a 3-element array [method, arguments, callId].`
      )
    }
    const [name, args, callId] = call as unknown[]
    if (typeof name !== "string" || name.length === 0) {
      throw invalid(`JMAP method call at index ${index} has no method name.`)
    }
    if (!args || typeof args !== "object" || Array.isArray(args)) {
      throw invalid(
        `JMAP method call "${name}" must have an object of arguments.`
      )
    }
    if (typeof callId !== "string" || callId.length === 0) {
      throw invalid(`JMAP method call "${name}" has no call id.`)
    }
  })

  // `createdIds` is optional but, when present, must be an object (not array).
  if (
    createdIds !== undefined &&
    (createdIds === null ||
      typeof createdIds !== "object" ||
      Array.isArray(createdIds))
  ) {
    throw invalid("JMAP request 'createdIds' must be an object.")
  }
}
