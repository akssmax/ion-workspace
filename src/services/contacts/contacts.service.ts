/**
 * Contacts domain service.
 */

import type { AddressBook, Contact, JmapId } from "../../jmap/types/contacts"
import { getJmapClient, getPrimaryAccountId } from "../jmap.service"

export async function getAddressBooks(): Promise<AddressBook[]> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId("urn:ietf:params:jmap:contacts")
  if (!accountId) return []
  client.contacts.bindAccount(accountId)
  return client.contacts.getAddressBooks(accountId)
}

export async function getAllContacts(): Promise<Contact[]> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId("urn:ietf:params:jmap:contacts")
  if (!accountId) return []
  client.contacts.bindAccount(accountId)
  return client.contacts.getAllContacts({}, accountId)
}

/**
 * Recipient autocomplete used by the composer.
 */
export async function searchContacts(
  text: string,
  limit = 10
): Promise<Contact[]> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId("urn:ietf:params:jmap:contacts")
  if (!accountId) return []
  client.contacts.bindAccount(accountId)
  return client.contacts.search(text, { limit }, accountId)
}

export async function createContact(
  contact: Partial<Contact>
): Promise<string> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId("urn:ietf:params:jmap:contacts")
  if (!accountId) throw new Error("No contacts account available.")
  client.contacts.bindAccount(accountId)

  const addressBookIds =
    contact.addressBookIds && Object.keys(contact.addressBookIds).length > 0
      ? contact.addressBookIds
      : await resolveDefaultAddressBookIds(accountId)

  return client.contacts.createContact(
    { ...contact, addressBookIds },
    accountId
  )
}

/**
 * A contact must belong to at least one address book, so pick a sensible
 * default when the caller did not supply one.
 */
async function resolveDefaultAddressBookIds(
  accountId: string
): Promise<Record<string, boolean>> {
  const client = await getJmapClient()
  const books = await client.contacts.getAddressBooks(accountId)
  const writable = books.filter(
    (book) =>
      !book.isReadOnly &&
      book.myRights?.mayWrite !== false &&
      book.myRights?.mayAddItems !== false
  )
  const preferred =
    writable.find((book) => book.isDefault) ??
    writable.find((book) => book.isSubscribed !== false) ??
    writable.at(0) ??
    books.find((book) => book.isDefault) ??
    books.at(0)
  if (!preferred)
    throw new Error("No address book is available to save this contact to.")
  return { [preferred.id]: true }
}

export async function updateContact(
  id: JmapId,
  patch: Partial<Record<string, unknown>>
): Promise<void> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId("urn:ietf:params:jmap:contacts")
  if (!accountId) return
  client.contacts.bindAccount(accountId)
  await client.contacts.updateContact(id, patch, accountId)
}

export async function destroyContact(id: JmapId): Promise<void> {
  const client = await getJmapClient()
  const accountId = await getPrimaryAccountId("urn:ietf:params:jmap:contacts")
  if (!accountId) return
  client.contacts.bindAccount(accountId)
  await client.contacts.destroyContact(id, accountId)
}
