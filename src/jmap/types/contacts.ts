/**
 * JMAP Contacts data types (RFC 9739) and method args.
 */

import type { JmapId } from "./mail"

export type { JmapId } from "./mail"

export interface AddressBook {
  id: JmapId
  name: string
  description?: string | null
  color?: string | null
  sortOrder?: number
  isReadOnly?: boolean
  myRights?: {
    mayReadItems?: boolean
    mayAddItems?: boolean
    mayModifyItems?: boolean
  }
}

export interface ContactEmail {
  type?: string | null
  value: string
  label?: string | null
  isDefault?: boolean
  joinedManually?: boolean
}

export interface ContactPhone {
  type:
    | "work"
    | "home"
    | "mobile"
    | "pager"
    | "video"
    | "textphone"
    | "fax"
    | "other"
  value: string
  label?: string | null
  isDefault?: boolean
}

export interface ContactAddress {
  type: "work" | "home" | "other"
  poBox?: string | null
  extended?: string | null
  street?: string | null
  locality?: string | null
  region?: string | null
  code?: string | null
  country?: string | null
  label?: string | null
}

export interface ContactName {
  familyName?: string
  givenNames?: string
  honorificPrefixes?: string
  honorificSuffixes?: string
  middleNames?: string
  nicknames?: string[]
  suffix?: string[]
  title?: string[]
}

export interface ContactOnline {
  type: "sip" | "video" | "messaging"
  value: string
  label?: string | null
  client?: string | null
  primary?: boolean
}

export interface Contact {
  id: JmapId
  addressBookIds: Record<JmapId, boolean>
  fn?: string | null
  n?: ContactName | null
  nickname?: string[] | null
  gender?: string | null
  anniversary?: string | null
  organization?: string | null
  fileAs?: string | null
  emails?: ContactEmail[]
  phones?: ContactPhone[]
  addresses?: ContactAddress[]
  online?: ContactOnline[]
  urls?: {
    type?: string | null
    value: string
    label?: string | null
    isDefault?: boolean
  }[]
  calendarUris?: string[]
  photo?: { id: JmapId; url?: string | null; type?: string | null }[] | null
  members?: string[]
  aka?: string[]
  notes?: string | null
  utcOffset?: string | null
  source?: string | null
}

export interface ContactGroup {
  id: JmapId
  names: string[]
  tagId?: string
  isReadOnly?: boolean
  myRights?: {
    mayReadItems?: boolean
    mayAddItems?: boolean
    mayModifyItems?: boolean
  }
}

export interface ContactFilterCondition {
  text?: string
  inAddressBook?: JmapId
  removal?: "in-progress"
  fn?: string
  email?: string
  complexity?: number
}

export interface ContactFilterSupport {
  allOf?: ContactFilterCondition[]
  anyOf?: ContactFilterCondition[]
  not?: ContactFilterCondition
}

export type ContactFilter = ContactFilterCondition & ContactFilterSupport

export interface ContactSortComparator {
  property: "fn" | "organization" | "anniversary" | "lastModified"
  isAscending?: boolean
  collation?: string
}

export interface ContactGetArgs {
  accountId: JmapId
  ids?: JmapId[] | null
  properties?: string[]
}

export interface ContactGetResponse {
  accountId: JmapId
  state: string
  list: Contact[]
  notFound: JmapId[]
}

export interface ContactQueryArgs {
  accountId: JmapId
  filter?: ContactFilter
  sort?: ContactSortComparator[]
  position?: number
  limit?: number | null
  calculateTotal?: boolean
}

export interface ContactQueryResponse {
  accountId: JmapId
  queryState: string
  canCalculateChanges: boolean
  position: number
  ids: JmapId[]
  total?: number
}

export interface ContactSetArgs {
  accountId: JmapId
  ifInState?: string
  create?: Record<string, Partial<Contact>>
  update?: Record<string, Partial<Record<string, unknown>>>
  destroy?: JmapId[]
}

export interface ContactSetResponse {
  accountId: JmapId
  oldState: string
  newState: string
  created?: Record<string, Partial<Contact>>
  updated?: Record<string, Partial<Contact> | null>
  destroyed?: JmapId[]
  notCreated?: Record<string, { type: string; description?: string }>
  notUpdated?: Record<string, { type: string; description?: string }>
  notDestroyed?: Record<string, { type: string; description?: string }>
}
