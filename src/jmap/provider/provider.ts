/**
 * JmapProvider abstraction.
 *
 * Implementations:
 *  - RealJmapProvider  → talks to Stalwart through the server proxy
 *  - MockJmapProvider  → talks to the in-memory mock server (no Stalwart)
 *
 * Providers are selected by the server-determined config (`getAppConfig`)
 * so switching between mock and real never requires UI changes.
 */

import type { JmapClient } from "../client/JmapClient"
import type { JmapSession } from "../types"
import { JMAP_CAPS } from "../types"

export interface JmapProvider {
  readonly mode: "mock" | "real"
  createClient(): Promise<JmapClient>
  /** Primary account id for the given capability. */
  resolveAccountId(
    client: JmapClient,
    capability?: string
  ): Promise<string | null>
}

export async function resolvePrimaryAccountId(
  client: JmapClient,
  capability: string = JMAP_CAPS.MAIL
): Promise<string | null> {
  const session = await client.session()
  const primary = session.primaryAccounts?.[capability]
  if (primary) return primary
  const accounts = Object.values(session.accounts ?? {})
  const matching = accounts.filter((account) => capability in (account.accountCapabilities ?? {}))
  const personal = matching.find((a) => a.isPersonal)
  return personal?.id ?? matching[0]?.id ?? null
}

export type { JmapSession }
