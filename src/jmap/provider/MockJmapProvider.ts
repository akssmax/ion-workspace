/**
 * Mock JMAP provider: no Stalwart required. Uses the in-memory mock server
 * through the mock transport so the UI can be developed independently of
 * the backend and tests can run hermetically.
 */

import { JmapClient } from "../client/JmapClient"
import { JMAP_CAPS } from "../types"
import { MockTransport } from "./MockTransport"
import { MOCK_ACCOUNT_ID } from "./mock/data"
import { resolvePrimaryAccountId, type JmapProvider } from "./provider"

export class MockJmapProvider implements JmapProvider {
  readonly mode = "mock" as const

  private readonly transport = new MockTransport()

  async createClient(): Promise<JmapClient> {
    const client = new JmapClient(this.transport)
    client.mail.bindAccount(MOCK_ACCOUNT_ID)
    client.calendar.bindAccount(MOCK_ACCOUNT_ID)
    client.contacts.bindAccount(MOCK_ACCOUNT_ID)
    client.files.bindAccount(MOCK_ACCOUNT_ID)
    return client
  }

  async resolveAccountId(client: JmapClient): Promise<string | null> {
    return resolvePrimaryAccountId(client, JMAP_CAPS.MAIL) ?? MOCK_ACCOUNT_ID
  }

  /** Expose the underlying mock server (for dev tooling / tests). */
  get mockServer() {
    return this.transport["server"]
  }
}
