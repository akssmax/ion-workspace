/**
 * JMAP Calendar data types (RFC 8984) and method args.
 */

import type { JmapId } from "./mail"

export type { JmapId } from "./mail"

export type WithinTime = { within?: string } | { between?: [string, string] }

export interface Calendar {
  id: JmapId
  name: string
  description?: string | null
  color?: string | null
  sortOrder?: number
  isSubscribed?: boolean
  isReadOnly?: boolean
  shareWith?: { principal: string; readOnly?: boolean }[]
  myRights?: {
    mayReadItems?: boolean
    mayAddItems?: boolean
    mayModifyItems?: boolean
  }
}

export type ParticipationStatus =
  "NEEDS-ACTION" | "ACCEPTED" | "DECLINED" | "TENTATIVE" | "DELEGATED"

export interface Attendee {
  name?: string
  email: string
  role?: "CHAIR" | "REQ-PARTICIPANT" | "OPT-PARTICIPANT" | "NON-PARTICIPANT"
  sentBy?: string
  delegatedTo?: string
  delegatedFrom?: string
  participationStatus?: ParticipationStatus
  expectReply?: boolean
  scheduleAgent?: string
  scheduleSequence?: number
}

export interface RecurrenceRule {
  frequency:
    | "YEARLY"
    | "MONTHLY"
    | "WEEKLY"
    | "DAILY"
    | "HOURLY"
    | "MINUTELY"
    | "SECONDLY"
  interval?: number
  end?: string | null
  until?: string
  count?: number
  byDay?: string[]
  byMonth?: number[]
  byMonthDay?: number[]
  byYearDay?: number[]
  byWeekNo?: number[]
  byHour?: number[]
  byMinute?: number[]
  bySecond?: number[]
  bySetPos?: number[]
  wkst?: string
}

export interface CalendarEventReminder {
  type: "display" | "email" | "audio"
  trigger?: string
}

export interface CalendarEvent {
  id: JmapId
  baseEventId?: JmapId | null
  calendarId?: JmapId
  calendarIds?: Record<JmapId, boolean>
  uid: string
  title?: string | null
  description?: string | null
  location?: string | null
  freeBusyStatus?: "FREE" | "BUSY" | "TENTATIVE" | "UNAVAILABLE"
  priority?: number
  showWithoutTime?: boolean
  start: string
  timeZone?: string | null
  duration?: string
  allDay?: boolean
  recurrenceId?: string | null
  recurrenceRule?: RecurrenceRule | null
  recurrenceRules?: RecurrenceRule[] | null
  overrides?: Record<string, { start?: string; duration?: string }>
  reminders?: CalendarEventReminder[] | null
  useDefaultAlarms?: boolean
  attendees?: Attendee[] | null
  participants?:
    | Attendee[]
    | Record<
        string,
        {
          name?: string
          email?: string
          participationStatus?: string
          roles?: Record<string, boolean>
        }
      >
    | null
  locations?: Record<string, { name: string; "@type"?: string }>
  alerts?: Record<
    string,
    {
      "@type": string
      action: string
      trigger: { "@type": string; offset: string; relativeTo: string }
    }
  >
  links?: {
    href: string
    rel?: string | null
    title?: string | null
    contentType?: string
  }[]
  isResolved?: boolean
}

export interface CalendarEventFilterCondition {
  after?: string
  before?: string
  inCalendar?: JmapId
  uid?: string
  title?: string
  recurrenceId?: string
  source?: string
}

export interface CalendarEventFilterSupport {
  allOf?: CalendarEventFilterCondition[]
  anyOf?: CalendarEventFilterCondition[]
  not?: CalendarEventFilterCondition
}

export type CalendarEventFilter = CalendarEventFilterCondition &
  CalendarEventFilterSupport

export interface CalendarEventSortComparator {
  property: "start" | "title"
  isAscending?: boolean
}

export interface CalendarEventGetArgs {
  accountId: JmapId
  ids?: JmapId[] | null
  properties?: string[]
}

export interface CalendarEventGetResponse {
  accountId: JmapId
  state: string
  list: CalendarEvent[]
  notFound: JmapId[]
}

export interface CalendarEventQueryArgs {
  accountId: JmapId
  filter?: CalendarEventFilter
  sort?: CalendarEventSortComparator[]
  position?: number
  limit?: number | null
  calculateTotal?: boolean
  expandRecurrences?: boolean
  timeZone?: string
}

export interface CalendarEventQueryResponse {
  accountId: JmapId
  queryState: string
  canCalculateChanges: boolean
  position: number
  ids: JmapId[]
  total?: number
}

export interface CalendarEventSetArgs {
  accountId: JmapId
  ifInState?: string
  sendSchedulingMessages?: boolean
  create?: Record<string, Partial<CalendarEvent>>
  update?: Record<string, Partial<Record<string, unknown>>>
  destroy?: JmapId[]
}

export interface CalendarEventSetResponse {
  accountId: JmapId
  oldState: string
  newState: string
  created?: Record<string, Partial<CalendarEvent>>
  updated?: Record<string, Partial<CalendarEvent> | null>
  destroyed?: JmapId[]
  notCreated?: Record<string, { type: string; description?: string }>
  notUpdated?: Record<string, { type: string; description?: string }>
  notDestroyed?: Record<string, { type: string; description?: string }>
}
