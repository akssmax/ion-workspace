/**
 * JMAP Contacts namespace API (RFC 9610). Contacts are JSContact Cards
 * ("ContactCard") on the wire and are mapped to the app's flatter shape.
 */

import type { JmapClient } from "./JmapClient"
import type {
  AddressBook,
  Contact,
  ContactFilter,
  ContactGetResponse,
  ContactGroup,
  ContactQueryResponse,
  ContactSetArgs,
  ContactSetResponse,
  ContactSortComparator,
  JmapId,
  JsContactCard,
} from "../types/contacts"
import {
  contactFromJsContact,
  contactToJsContactCreate,
  contactToJsContactPatch,
} from "../types/contacts"

export interface ContactQueryOptions {
  filter?: ContactFilter
  sort?: ContactSortComparator[]
  limit?: number | null
  position?: number
  calculateTotal?: boolean
}

export class ContactsApi {
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
      throw new Error("The JMAP contacts namespace is not bound to an account.")
  }

  async getAddressBooks(accountId?: string): Promise<AddressBook[]> {
    const res = await this.client.call<{ list: AddressBook[] }>(
      "AddressBook/get",
      { accountId: this.acct(accountId) },
      "ab0"
    )
    return res.list
  }

  /**
   * Query contacts (e.g. text autocomplete).
   */
  async queryContacts(
    filter: ContactFilter,
    options: ContactQueryOptions = {},
    accountId?: string
  ): Promise<{ queryState: string; ids: JmapId[]; total?: number }> {
    const res = await this.client.call<ContactQueryResponse>(
      "ContactCard/query",
      {
        accountId: this.acct(accountId),
        filter,
        ...(options.sort ? { sort: options.sort } : {}),
        position: options.position,
        limit: options.limit ?? null,
        calculateTotal: options.calculateTotal,
      },
      "cq0"
    )
    return { queryState: res.queryState, ids: res.ids, total: res.total }
  }

  /**
   * Text search across contacts returning contact objects (query + get).
   */
  async search(
    text: string,
    options: { limit?: number } = {},
    accountId?: string
  ): Promise<Contact[]> {
    this.checkAccount()
    const acc = this.acct(accountId)
    const qid = "csq"
    const gid = "csg"
    const res = await this.client.invoke(
      [
        {
          id: qid,
          method: "ContactCard/query",
          args: {
            accountId: acc,
            filter: { text },
            limit: options.limit ?? 25,
            calculateTotal: true,
          },
        },
        {
          id: gid,
          method: "ContactCard/get",
          args: { accountId: acc, ids: [`#${qid}`] },
          resultOf: { callId: qid, name: "ContactCard/query", path: "/ids/*" },
        },
      ],
      { accountId: acc }
    )
    const get = res.get<ContactGetResponse>(gid)
    return visibleContacts(get.list)
  }

  async getContactsByIds(
    ids: JmapId[],
    accountId?: string
  ): Promise<Contact[]> {
    const res = await this.client.call<ContactGetResponse>(
      "ContactCard/get",
      { accountId: this.acct(accountId), ids },
      "cg0"
    )
    return visibleContacts(res.list)
  }

  async getAllContacts(
    options: ContactQueryOptions = {},
    accountId?: string
  ): Promise<Contact[]> {
    this.checkAccount()
    const acc = this.acct(accountId)
    const qid = "caq"
    const gid = "cag"
    const res = await this.client.invoke(
      [
        {
          id: qid,
          method: "ContactCard/query",
          args: {
            accountId: acc,
            ...(options.sort ? { sort: options.sort } : {}),
            limit: options.limit,
          },
        },
        {
          id: gid,
          method: "ContactCard/get",
          args: { accountId: acc, ids: [`#${qid}`] },
          resultOf: { callId: qid, name: "ContactCard/query", path: "/ids/*" },
        },
      ],
      { accountId: acc }
    )
    const get = res.get<ContactGetResponse>(gid)
    return visibleContacts(get.list)
  }

  async createContact(
    contact: Partial<Contact>,
    accountId?: string
  ): Promise<string> {
    const acc = this.acct(accountId)
    const args: ContactSetArgs = {
      accountId: acc,
      create: { c0: contactToJsContactCreate(contact) },
    }
    const res = await this.client.call<ContactSetResponse>(
      "ContactCard/set",
      args,
      "csnew"
    )
    if (res.notCreated?.c0)
      throw new Error(res.notCreated.c0.description ?? res.notCreated.c0.type)
    const id = res.created?.c0.id
    if (!id)
      throw new Error(
        "The contact server did not confirm the contact was created."
      )
    return id
  }

  async updateContact(
    id: JmapId,
    patch: Partial<Record<string, unknown>>,
    accountId?: string
  ): Promise<void> {
    const acc = this.acct(accountId)
    const args: ContactSetArgs = {
      accountId: acc,
      update: { [id]: contactToJsContactPatch(patch) },
    }
    const res = await this.client.call<ContactSetResponse>(
      "ContactCard/set",
      args,
      "csupd"
    )
    if (res.notUpdated?.[id])
      throw new Error(res.notUpdated[id].description ?? res.notUpdated[id].type)
  }

  async destroyContact(id: JmapId, accountId?: string): Promise<void> {
    const acc = this.acct(accountId)
    const args: ContactSetArgs = { accountId: acc, destroy: [id] }
    const res = await this.client.call<ContactSetResponse>(
      "ContactCard/set",
      args,
      "csdel"
    )
    if (res.notDestroyed?.[id])
      throw new Error(
        res.notDestroyed[id].description ?? res.notDestroyed[id].type
      )
  }

  async getGroups(accountId?: string): Promise<ContactGroup[]> {
    const res = await this.client.call<{ list: ContactGroup[] }>(
      "ContactGroup/get",
      { accountId: this.acct(accountId) },
      "grp0"
    )
    return res.list
  }
}

/**
 * Map wire ContactCards to the app's contact shape, dropping group cards
 * (which this UI does not surface) and sorting by display name.
 */
function visibleContacts(cards: JsContactCard[]): Contact[] {
  return cards
    .filter((card) => card.kind !== "group")
    .map(contactFromJsContact)
    .sort((a, b) =>
      (a.fn ?? "").localeCompare(b.fn ?? "", undefined, {
        sensitivity: "base",
      })
    )
}

export type {
  AddressBook as AddressBookDto,
  Contact as ContactDto,
  ContactGroup as ContactGroupDto,
} from "../types/contacts"
export type { ContactEmail as ContactEmailDto } from "../types/contacts"
