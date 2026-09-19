/**
 * JMAP Contacts namespace API (RFC 9739).
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
      "Contact/query",
      {
        accountId: this.acct(accountId),
        filter,
        sort: options.sort ?? [{ property: "fn", isAscending: true }],
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
          method: "Contact/query",
          args: {
            accountId: acc,
            filter: { text },
            sort: [{ property: "fn", isAscending: true }],
            limit: options.limit ?? 25,
            calculateTotal: true,
          },
        },
        {
          id: gid,
          method: "Contact/get",
          args: { accountId: acc, ids: [`#${qid}`] },
          resultOf: { callId: qid, name: "Contact/query", path: "/ids/*" },
        },
      ],
      { accountId: acc }
    )
    const get = res.get<ContactGetResponse>(gid)
    return get.list
  }

  async getContactsByIds(
    ids: JmapId[],
    accountId?: string
  ): Promise<Contact[]> {
    const res = await this.client.call<ContactGetResponse>(
      "Contact/get",
      { accountId: this.acct(accountId), ids },
      "cg0"
    )
    return res.list
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
          method: "Contact/query",
          args: {
            accountId: acc,
            sort: options.sort ?? [{ property: "fn", isAscending: true }],
            limit: options.limit,
          },
        },
        {
          id: gid,
          method: "Contact/get",
          args: { accountId: acc, ids: [`#${qid}`] },
          resultOf: { callId: qid, name: "Contact/query", path: "/ids/*" },
        },
      ],
      { accountId: acc }
    )
    const get = res.get<ContactGetResponse>(gid)
    return get.list
  }

  async createContact(
    contact: Partial<Contact>,
    accountId?: string
  ): Promise<string> {
    const acc = this.acct(accountId)
    const args: ContactSetArgs = { accountId: acc, create: { c0: contact } }
    const res = await this.client.call<ContactSetResponse>(
      "Contact/set",
      args,
      "csnew"
    )
    return Object.values(res.created ?? {})[0]?.id ?? ""
  }

  async updateContact(
    id: JmapId,
    patch: Partial<Record<string, unknown>>,
    accountId?: string
  ): Promise<void> {
    const acc = this.acct(accountId)
    const args: ContactSetArgs = { accountId: acc, update: { [id]: patch } }
    await this.client.call<ContactSetResponse>("Contact/set", args, "csupd")
  }

  async destroyContact(id: JmapId, accountId?: string): Promise<void> {
    const acc = this.acct(accountId)
    const args: ContactSetArgs = { accountId: acc, destroy: [id] }
    await this.client.call<ContactSetResponse>("Contact/set", args, "csdel")
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

export type {
  AddressBook as AddressBookDto,
  Contact as ContactDto,
  ContactGroup as ContactGroupDto,
} from "../types/contacts"
export type { ContactEmail as ContactEmailDto } from "../types/contacts"
