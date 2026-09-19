/**
 * Real JMAP provider backed by Stalwart (via the server proxy transport).
 */

import { JmapClient } from "../client/JmapClient"
import { JMAP_CAPS } from "../types"
import { ServerProxyTransport } from "./ServerProxyTransport"
import { resolvePrimaryAccountId, type JmapProvider } from "./provider"

export interface RealJmapProviderOptions {
  publicEventSourceUrl?: string | null
}

export class RealJmapProvider implements JmapProvider {
  readonly mode = "real" as const
  private readonly transport: ServerProxyTransport

  constructor(options: RealJmapProviderOptions = {}) {
    this.transport = new ServerProxyTransport({
      publicEventSourceUrl: options.publicEventSourceUrl,
    })
  }

  async createClient(): Promise<JmapClient> {
    const client = new JmapClient(this.transport)
    const [mail, calendar, contacts, files] = await Promise.all([
      JMAP_CAPS.MAIL, JMAP_CAPS.CALENDARS, JMAP_CAPS.CONTACTS, JMAP_CAPS.FILES,
    ].map((capability) => resolvePrimaryAccountId(client, capability)))
    if (mail) client.mail.bindAccount(mail)
    if (calendar) client.calendar.bindAccount(calendar)
    if (contacts) client.contacts.bindAccount(contacts)
    if (files) client.files.bindAccount(files)
    return client
  }

  async resolveAccountId(client: JmapClient, capability = JMAP_CAPS.MAIL): Promise<string | null> {
    return resolvePrimaryAccountId(client, capability)
  }
}
