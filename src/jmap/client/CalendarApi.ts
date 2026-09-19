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

export interface CalendarEventQueryOptions {
  filter?: CalendarEventFilter
  sort?: CalendarEventSortComparator[]
  limit?: number | null
  position?: number
  calculateTotal?: boolean
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
    options: { calendarIds?: JmapId[] } = {},
    accountId?: string
  ): Promise<CalendarEvent[]> {
    this.checkAccount()
    const acc = this.acct(accountId)
    const qid = "crq"
    const gid = "crg"
    const filter: CalendarEventFilter = {
      after: start,
      before: end,
    }
    if (options.calendarIds?.length === 1)
      filter.inCalendar = options.calendarIds[0]

    const res = await this.client.invoke(
      [
        {
          id: qid,
          method: "CalendarEvent/query",
          args: {
            accountId: acc,
            filter,
            sort: [{ property: "start", isAscending: true }],
            calculateTotal: true,
          },
        },
        {
          id: gid,
          method: "CalendarEvent/get",
          args: { accountId: acc, ids: [`#${qid}`] },
          resultOf: {
            callId: qid,
            name: "CalendarEvent/query",
            path: "/ids/*",
          },
        },
      ],
      { accountId: acc }
    )

    const get = res.get<CalendarEventGetResponse>(gid)
    return get.list
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
    options: { ifInState?: string } = {},
    accountId?: string
  ): Promise<CalendarEventSetResponse> {
    this.checkAccount()
    const acc = this.acct(accountId)
    const args: CalendarEventSetArgs = { accountId: acc }
    if (options.ifInState) args.ifInState = options.ifInState
    if (mutation.create?.length) {
      args.create = {}
      mutation.create.forEach((ev, i) => {
        args.create![`c${i}`] = ev
      })
    }
    if (mutation.update?.length) {
      args.update = {}
      for (const { id, patch } of mutation.update) args.update[id] = patch
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
    accountId?: string
  ): Promise<string> {
    const res = await this.applyMutations({ create: [event] }, {}, accountId)
    return Object.values(res.created ?? {})[0]?.id ?? ""
  }

  async updateEvent(
    id: JmapId,
    patch: Partial<Record<string, unknown>>,
    accountId?: string
  ): Promise<void> {
    await this.applyMutations({ update: [{ id, patch }] }, {}, accountId)
  }

  async destroyEvent(id: JmapId, accountId?: string): Promise<void> {
    await this.applyMutations({ destroy: [id] }, {}, accountId)
  }
}

export type {
  Calendar as CalendarDto,
  CalendarEvent as CalendarEventDto,
} from "../types/calendar"
export type { CalendarEventReminder as ReminderDto } from "../types/calendar"
