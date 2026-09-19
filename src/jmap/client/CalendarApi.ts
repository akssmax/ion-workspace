/**
 * JMAP Calendar namespace API (RFC 8984).
 */

import type { JmapClient } from "./JmapClient"
import type {
  Calendar,
  CalendarEvent,
  CalendarEventFilter,
  CalendarEventGetResponse,
  CalendarEventQueryResponse,
  CalendarEventSetArgs,
  CalendarEventSetResponse,
  CalendarEventSortComparator,
  JmapId,
} from "../types/calendar"
import { eventCalendarId } from "@/lib/calendar-event"

export interface CalendarEventQueryOptions {
  filter?: CalendarEventFilter
  sort?: CalendarEventSortComparator[]
  limit?: number | null
  position?: number
  calculateTotal?: boolean
  expandRecurrences?: boolean
  timeZone?: string
}

export interface CalendarEventMutation {
  create?: Partial<CalendarEvent>[]
  update?: { id: JmapId; patch: Partial<Record<string, unknown>> }[]
  destroy?: JmapId[]
}

export class CalendarApi {
  private _accountId: string | null = null

  constructor(private readonly client: JmapClient) {}

  get accountId(): string | null {
    return this._accountId
  }

  bindAccount(accountId: string): void {
    this._accountId = accountId
  }

  private acct(accountId?: string): string {
    return accountId ?? this._accountId ?? ""
  }

  private checkAccount(): void {
    if (!this._accountId)
      throw new Error("The JMAP calendar namespace is not bound to an account.")
  }

  async getCalendars(accountId?: string): Promise<Calendar[]> {
    const res = await this.client.call<{ list: Calendar[] }>(
      "Calendar/get",
      { accountId: this.acct(accountId) },
      "cal0"
    )
    return res.list
  }

  async createCalendar(
    name: string,
    color?: string,
    accountId?: string
  ): Promise<string> {
    const response = await this.client.call<{
      created?: Record<string, { id: string }>
      notCreated?: Record<string, { type: string; description?: string }>
    }>(
      "Calendar/set",
      {
        accountId: this.acct(accountId),
        create: { new: { name, color } },
      },
      "calset"
    )
    if (response.notCreated?.new)
      throw new Error(
        response.notCreated.new.description ?? response.notCreated.new.type
      )
    if (!response.created?.new?.id)
      throw new Error("The calendar server did not confirm creation.")
    return response.created.new.id
  }

  /**
   * Query events across calendars, typically for a date range.
   */
  async queryEvents(
    filter: CalendarEventFilter,
    options: CalendarEventQueryOptions = {},
    accountId?: string
  ): Promise<{
    queryState: string
    ids: JmapId[]
    position: number
    total?: number
  }> {
    const res = await this.client.call<CalendarEventQueryResponse>(
      "CalendarEvent/query",
      {
        accountId: this.acct(accountId),
        filter,
        sort: options.sort ?? [{ property: "start", isAscending: true }],
        position: options.position,
        limit: options.limit ?? null,
        calculateTotal: options.calculateTotal,
        expandRecurrences: options.expandRecurrences,
        timeZone: options.timeZone,
      },
      "ceq0"
    )
    return {
      queryState: res.queryState,
      ids: res.ids,
      position: res.position,
      total: res.total,
    }
  }

  /**
   * Get events in a time range, batched query + get.
   */
  async getEventsInRange(
    start: string,
    end: string,
    options: { calendarIds?: JmapId[]; timeZone?: string } = {},
    accountId?: string
  ): Promise<CalendarEvent[]> {
    this.checkAccount()
    const acc = this.acct(accountId)
    const filter: CalendarEventFilter = {
      after: start.slice(0, 19),
      before: end.slice(0, 19),
    }
    if (options.calendarIds?.length === 1)
      filter.inCalendar = options.calendarIds[0]

    const events: CalendarEvent[] = []
    let position = 0
    for (;;) {
      const query = await this.queryEvents(
        filter,
        {
          position,
          limit: 250,
          calculateTotal: true,
          expandRecurrences: true,
          timeZone: "Etc/UTC",
        },
        acc
      )
      if (!query.ids.length) break
      for (let offset = 0; offset < query.ids.length; offset += 250) {
        events.push(
          ...(await this.getEventsByIds(
            query.ids.slice(offset, offset + 250),
            acc
          ))
        )
      }
      position += query.ids.length
      if (
        query.ids.length < 250 ||
        (query.total !== undefined && position >= query.total)
      )
        break
    }
    return options.calendarIds?.length
      ? events.filter((event) =>
          options.calendarIds!.includes(eventCalendarId(event))
        )
      : events
  }

  async getEventsByIds(
    ids: JmapId[],
    accountId?: string
  ): Promise<CalendarEvent[]> {
    const res = await this.client.call<CalendarEventGetResponse>(
      "CalendarEvent/get",
      { accountId: this.acct(accountId), ids },
      "ceg0"
    )
    return res.list
  }

  /**
   * Apply create/update/destroy mutations in one set call.
   */
  async applyMutations(
    mutation: CalendarEventMutation,
    options: { ifInState?: string; sendSchedulingMessages?: boolean } = {},
    accountId?: string
  ): Promise<CalendarEventSetResponse> {
    this.checkAccount()
    const acc = this.acct(accountId)
    const args: CalendarEventSetArgs = { accountId: acc }
    const protocolEvent = (event: Partial<CalendarEvent>) => {
      if (this.client.isMock) return event
      const { calendarId: _legacyCalendarId, allDay: _legacyAllDay, attendees: _legacyAttendees, ...jmapEvent } = event
      void _legacyCalendarId
      void _legacyAllDay
      void _legacyAttendees
      return jmapEvent
    }
    if (options.ifInState) args.ifInState = options.ifInState
    args.sendSchedulingMessages = options.sendSchedulingMessages ?? false
    if (mutation.create?.length) {
      args.create = {}
      mutation.create.forEach((ev, i) => {
        args.create![`c${i}`] = protocolEvent(ev)
      })
    }
    if (mutation.update?.length) {
      args.update = {}
      for (const { id, patch } of mutation.update) args.update[id] = protocolEvent(patch as Partial<CalendarEvent>)
    }
    if (mutation.destroy?.length) args.destroy = mutation.destroy

    const res = await this.client.call<CalendarEventSetResponse>(
      "CalendarEvent/set",
      args,
      "cevts"
    )
    if (args.create) {
      const createdIds = res.created ?? {}
      const clientIdMap: Record<string, string> = {}
      for (const [clientId, value] of Object.entries(createdIds)) {
        if (value.id) clientIdMap[clientId] = value.id
      }
      void clientIdMap
    }
    return res
  }

  async createEvent(
    event: Partial<CalendarEvent>,
    accountId?: string,
    sendSchedulingMessages = true
  ): Promise<string> {
    const res = await this.applyMutations(
      { create: [event] },
      { sendSchedulingMessages },
      accountId
    )
    if (res.notCreated?.c0)
      throw new Error(res.notCreated.c0.description ?? res.notCreated.c0.type)
    const id = res.created?.c0?.id
    if (!id)
      throw new Error(
        "The calendar server did not confirm the event was created."
      )
    return id
  }

  async updateEvent(
    id: JmapId,
    patch: Partial<Record<string, unknown>>,
    accountId?: string,
    sendSchedulingMessages = true
  ): Promise<void> {
    const res = await this.applyMutations(
      { update: [{ id, patch }] },
      { sendSchedulingMessages },
      accountId
    )
    if (res.notUpdated?.[id])
      throw new Error(res.notUpdated[id].description ?? res.notUpdated[id].type)
    if (!(id in (res.updated ?? {})))
      throw new Error("The calendar server did not confirm the update.")
  }

  async destroyEvent(id: JmapId, accountId?: string): Promise<void> {
    const res = await this.applyMutations(
      { destroy: [id] },
      { sendSchedulingMessages: true },
      accountId
    )
    if (res.notDestroyed?.[id])
      throw new Error(
        res.notDestroyed[id].description ?? res.notDestroyed[id].type
      )
    if (!res.destroyed?.includes(id))
      throw new Error("The calendar server did not confirm deletion.")
  }
}

export type {
  Calendar as CalendarDto,
  CalendarEvent as CalendarEventDto,
} from "../types/calendar"
export type { CalendarEventReminder as ReminderDto } from "../types/calendar"
