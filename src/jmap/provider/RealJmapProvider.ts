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
    const accountId = await this.resolveAccountId(client)
    if (accountId) {
      client.mail.bindAccount(accountId)
      client.calendar.bindAccount(accountId)
      client.contacts.bindAccount(accountId)
      client.files.bindAccount(accountId)
    }
    return client
  }

  async resolveAccountId(client: JmapClient): Promise<string | null> {
    return resolvePrimaryAccountId(client, JMAP_CAPS.MAIL)
  }
}
