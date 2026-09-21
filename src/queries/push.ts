/**
 * JMAP push → React Query invalidation bridge.
 *
 * Mounted once by the app shell. Every server push event invalidates the
 * queries for the changed entity type so the UI refreshes live (new mail
 * arriving, another client moving messages, …).
 *
 * Push is multiplexed through a single connection: every subscriber (the
 * invalidation bridge and, e.g., the notifications feature) shares one
 * `startPush` subscription rather than opening a stream each.
 */

import { useEffect, useRef } from "react"
import type { QueryClient } from "@tanstack/react-query"
import { useQueryClient } from "@tanstack/react-query"
import { getJmapClient } from "../services/jmap.service"
import { qk } from "./keys"
import { ACCOUNT_KEY } from "./client"

export type PushEntity =
  "Email" | "Mailbox" | "CalendarEvent" | "Contact" | "FileNode"

export interface PushEvent {
  entity: PushEntity
  payload: Record<string, unknown>
}

const PUSH_ENTITIES: readonly PushEntity[] = [
  "Email",
  "Mailbox",
  "CalendarEvent",
  "Contact",
  "FileNode",
]

function isPushEntity(value: unknown): value is PushEntity {
  return (
    typeof value === "string" &&
    (PUSH_ENTITIES as readonly string[]).includes(value)
  )
}

/**
 * Normalize a raw push payload into the entity types that changed. Mock mode
 * emits `{ type: "Email", changed: true }`; real StateChange payloads carry a
 * `changed` map of `accountId → { Email: state, … }`.
 */
export function normalizePushEvent(
  payload: Record<string, unknown>
): PushEntity[] {
  if (isPushEntity(payload.type)) return [payload.type]
  if (payload.type === "ContactCard") return ["Contact"]
  const changed = payload.changed
  if (changed && typeof changed === "object") {
    const entities = new Set<PushEntity>()
    for (const perAccount of Object.values(changed)) {
      if (!perAccount || typeof perAccount !== "object") continue
      for (const key of Object.keys(perAccount)) {
        if (isPushEntity(key)) entities.add(key)
        else if (key === "ContactCard") entities.add("Contact")
      }
    }
    return [...entities]
  }
  return []
}

// -- Multiplexed connection -------------------------------------------------

type Listener = (event: PushEvent) => void
const listeners = new Set<Listener>()
let subscription: { close: () => void } | null = null
let connecting: Promise<void> | null = null

function ensureSubscription(): Promise<void> {
  if (subscription) return Promise.resolve()
  if (connecting) return connecting
  connecting = getJmapClient()
    .then((client) => {
      subscription = client.startPush((payload) => {
        for (const entity of normalizePushEvent(payload)) {
          for (const listener of listeners) listener({ entity, payload })
        }
      })
    })
    .catch(() => {
      // Push is best-effort; polling/invalidation still apply.
    })
    .finally(() => {
      connecting = null
    })
  return connecting
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  void ensureSubscription()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      subscription?.close()
      subscription = null
    }
  }
}

/** Subscribe to normalized push events for the lifetime of the component. */
export function usePushSubscription(handler: (event: PushEvent) => void): void {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => subscribe((event) => ref.current(event)), [])
}

/**
 * Coalesce push events before invalidating. Bulk syncs and multi-item changes
 * arrive as bursts; without this every event refetched the list, mailboxes and
 * the open thread separately.
 */
const PUSH_DEBOUNCE_MS = 300

function invalidateEntity(queryClient: QueryClient, entity: PushEntity): void {
  switch (entity) {
    case "Email":
      void queryClient.invalidateQueries({ queryKey: [ACCOUNT_KEY, "emails"] })
      void queryClient.invalidateQueries({ queryKey: [ACCOUNT_KEY, "thread"] })
      void queryClient.invalidateQueries({
        queryKey: [ACCOUNT_KEY, "thread-emails"],
      })
      // Counts on mailboxes change with email events too.
      void queryClient.invalidateQueries({ queryKey: qk.mailboxes() })
      break
    case "Mailbox":
      void queryClient.invalidateQueries({ queryKey: qk.mailboxes() })
      break
    case "CalendarEvent":
      void queryClient.invalidateQueries({ queryKey: [ACCOUNT_KEY, "events"] })
      break
    case "Contact":
      void queryClient.invalidateQueries({
        queryKey: [ACCOUNT_KEY, "contacts"],
      })
      break
    case "FileNode":
      void queryClient.invalidateQueries({ queryKey: [ACCOUNT_KEY, "files"] })
      break
  }
}

export function useJmapPush(): void {
  const queryClient = useQueryClient()
  const pending = useRef(new Set<PushEntity>())
  const timer = useRef<number | null>(null)

  usePushSubscription(({ entity }) => {
    pending.current.add(entity)
    if (timer.current !== null) return
    timer.current = window.setTimeout(() => {
      timer.current = null
      for (const changed of pending.current) {
        invalidateEntity(queryClient, changed)
      }
      pending.current.clear()
    }, PUSH_DEBOUNCE_MS)
  })

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    []
  )
}
