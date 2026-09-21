/**
 * Contacts data types (RFC 9610) built on JSContact Cards (RFC 9553), plus the
 * app's internal contact shape and conversions between the two.
 */

import type { JmapId } from "./mail"

export type { JmapId } from "./mail"

export interface AddressBook {
  id: JmapId
  name: string
  description?: string | null
  color?: string | null
  sortOrder?: number
  isDefault?: boolean
  isSubscribed?: boolean
  isReadOnly?: boolean
  myRights?: {
    mayRead?: boolean
    mayWrite?: boolean
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

// -- JSContact wire format (RFC 9553 / RFC 9610) -----------------------------

export interface JsContactNameComponent {
  kind:
    | "given"
    | "given2"
    | "surname"
    | "surname2"
    | "title"
    | "credential"
    | "prefix"
    | "suffix"
    | "nickname"
  value: string
}

export interface JsContactName {
  "@type"?: "Name"
  components?: JsContactNameComponent[]
  isOrdered?: boolean
  full?: string
}

export interface JsContactOrganization {
  "@type"?: "Organization"
  name: string
  units?: { name: string }[]
}

export interface JsContactEmail {
  "@type"?: "EmailAddress"
  address: string
  contexts?: Record<string, boolean>
  pref?: number
  label?: string
}

export interface JsContactPhone {
  "@type"?: "Phone"
  number: string
  contexts?: Record<string, boolean>
  pref?: number
  label?: string
}

export interface JsContactNote {
  "@type"?: "Note"
  note: string
}

/**
 * A JMAP `ContactCard`: a JSContact Card plus the JMAP-assigned `id` and
 * `addressBookIds`.
 */
export interface JsContactCard {
  "@type"?: "Card"
  version?: string
  id: JmapId
  uid?: string
  kind?: string
  addressBookIds: Record<JmapId, boolean>
  name?: JsContactName | null
  nicknames?: Record<string, { name: string }> | null
  organizations?: Record<string, JsContactOrganization> | null
  emails?: Record<string, JsContactEmail> | null
  phones?: Record<string, JsContactPhone> | null
  notes?: Record<string, JsContactNote> | null
  [key: string]: unknown
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
  property:
    "created" | "updated" | "name/given" | "name/surname" | "name/surname2"
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
  list: JsContactCard[]
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
  create?: Record<string, Record<string, unknown>>
  update?: Record<string, Record<string, unknown>>
  destroy?: JmapId[]
}

export interface ContactSetResponse {
  accountId: JmapId
  oldState: string
  newState: string
  created?: Record<string, { id: JmapId }>
  updated?: Record<string, Record<string, unknown> | null>
  destroyed?: JmapId[]
  notCreated?: Record<string, { type: string; description?: string }>
  notUpdated?: Record<string, { type: string; description?: string }>
  notDestroyed?: Record<string, { type: string; description?: string }>
}

// -- Internal ↔ JSContact conversion -----------------------------------------

function componentValue(
  name: JsContactName | null | undefined,
  kind: JsContactNameComponent["kind"]
): string | undefined {
  const component = name?.components?.find((part) => part.kind === kind)
  return component?.value || undefined
}

function nameFromComponents(
  name: JsContactName | null | undefined
): string | null {
  const parts = (name?.components ?? [])
    .filter((part) => part.kind === "given" || part.kind === "surname")
    .map((part) => part.value)
  return parts.length ? parts.join(" ") : null
}

function contextToType(contexts: Record<string, boolean> | undefined): string {
  if (!contexts) return "work"
  if (contexts.home || contexts.private) return "home"
  if (contexts.work) return "work"
  return Object.keys(contexts).at(0) ?? "work"
}

function typeToContexts(
  type: string | null | undefined
): Record<string, boolean> {
  const normalized = (type ?? "").toLowerCase()
  if (
    normalized === "home" ||
    normalized === "private" ||
    normalized === "personal"
  )
    return { private: true }
  return { work: true }
}

function firstEntry<T>(
  map: Record<string, T> | null | undefined
): T | undefined {
  if (!map) return undefined
  return Object.values(map)[0]
}

function entries<T>(map: Record<string, T> | null | undefined): T[] {
  return map ? Object.values(map) : []
}

/** Convert a JMAP ContactCard into the app's internal contact shape. */
export function contactFromJsContact(card: JsContactCard): Contact {
  const emails: ContactEmail[] = entries(card.emails).map((email) => ({
    type: contextToType(email.contexts),
    value: email.address,
    isDefault: email.pref === 1,
  }))
  const phones: ContactPhone[] = entries(card.phones).map((phone) => ({
    type: contextToType(phone.contexts) as ContactPhone["type"],
    value: phone.number,
    isDefault: phone.pref === 1,
  }))
  const organization = existingString(firstEntry(card.organizations)?.name)
  const note = existingString(firstEntry(card.notes)?.note)
  const givenNames = componentValue(card.name, "given")
  const familyName = componentValue(card.name, "surname")
  const fn =
    existingString(card.name?.full) ??
    nameFromComponents(card.name) ??
    existingString(organization)

  return {
    id: card.id,
    addressBookIds: card.addressBookIds,
    fn,
    n: givenNames || familyName ? { givenNames, familyName } : null,
    organization,
    emails: emails.length ? emails : undefined,
    phones: phones.length ? phones : undefined,
    notes: note,
  }
}

function existingString(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function mapEmails(
  emails: ContactEmail[] | undefined
): Record<string, JsContactEmail> | null {
  const list = emails ?? []
  if (!list.length) return null
  return Object.fromEntries(
    list.map((email, index) => {
      const preferred = email.isDefault ?? index === 0
      return [
        String(index),
        {
          "@type": "EmailAddress" as const,
          address: email.value,
          contexts: typeToContexts(email.type),
          ...(preferred ? { pref: 1 } : {}),
        },
      ]
    })
  )
}

function mapPhones(
  phones: ContactPhone[] | undefined
): Record<string, JsContactPhone> | null {
  const list = phones ?? []
  if (!list.length) return null
  return Object.fromEntries(
    list.map((phone, index) => {
      const preferred = phone.isDefault ?? index === 0
      return [
        String(index),
        {
          "@type": "Phone" as const,
          number: phone.value,
          contexts: typeToContexts(phone.type),
          ...(preferred ? { pref: 1 } : {}),
        },
      ]
    })
  )
}

/** Fields that a create payload may carry, mapped to JSContact. */
export function contactToJsContactFields(
  contact: Partial<Contact>
): Record<string, unknown> {
  const fields: Record<string, unknown> = {}
  if ("fn" in contact)
    fields.name = contact.fn ? { "@type": "Name", full: contact.fn } : null
  if ("organization" in contact)
    fields.organizations = contact.organization
      ? { "0": { "@type": "Organization", name: contact.organization } }
      : null
  if ("emails" in contact) fields.emails = mapEmails(contact.emails)
  if ("phones" in contact) fields.phones = mapPhones(contact.phones)
  if ("notes" in contact)
    fields.notes = contact.notes
      ? { "0": { "@type": "Note", note: contact.notes } }
      : null
  return fields
}

/** Complete payload for `ContactCard/set` create. */
export function contactToJsContactCreate(
  contact: Partial<Contact>
): Record<string, unknown> {
  return {
    "@type": "Card",
    version: "1.0",
    kind: "individual",
    ...(contact.addressBookIds
      ? { addressBookIds: contact.addressBookIds }
      : {}),
    ...contactToJsContactFields(contact),
  }
}

/** Patch payload for `ContactCard/set` update. */
export function contactToJsContactPatch(
  patch: Partial<Record<string, unknown>>
): Record<string, unknown> {
  return contactToJsContactFields(patch)
}
