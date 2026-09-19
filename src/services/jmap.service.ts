/**
 * Provides the active JMAP client to the rest of the app.
 *
 * Responsibilities:
 *  - select the provider based on server config (mock vs real)
 *  - own a process-wide singleton client
 *  - allow reset on logout/account switch
 */

import { getAppConfig } from "../server/auth.rpc"
import { JmapClient } from "../jmap/client/JmapClient"
import { MockJmapProvider } from "../jmap/provider/MockJmapProvider"
import { RealJmapProvider } from "../jmap/provider/RealJmapProvider"
import {
  resolvePrimaryAccountId,
  type JmapProvider,
} from "../jmap/provider/provider"
import { JMAP_CAPS } from "../jmap/types"

let currentClient: JmapClient | null = null
let currentProvider: JmapProvider | null = null
let resolving: Promise<JmapClient> | null = null

export async function getJmapClient(): Promise<JmapClient> {
  if (currentClient) return currentClient
  if (!resolving) {
    resolving = (async () => {
      const config = await getAppConfig()
      if (config.jmapMode === "real") {
        currentProvider = new RealJmapProvider({
          publicEventSourceUrl: config.publicEventSourceUrl,
        })
      } else {
        currentProvider = new MockJmapProvider()
      }
      const client = await currentProvider.createClient()
      currentClient = client
      return client
    })()
  }
  return resolving
}

/** The currently built client, or null before initialization. */
export function getCurrentJmapClient(): JmapClient | null {
  return currentClient
}

/**
 * The primary account id for a capability (mail by default).
 */
export async function getPrimaryAccountId(
  capability: string = JMAP_CAPS.MAIL
): Promise<string | null> {
  const client = await getJmapClient()
  if (!currentProvider) return resolvePrimaryAccountId(client, capability)
  return currentProvider.resolveAccountId(client, capability)
}

export function isMockMode(): boolean {
  return currentProvider == null || currentProvider.mode === "mock"
}

/**
 * Drop the cached client (logout/account change). The next call to
 * getJmapClient rebuilds it.
 */
export function resetJmapClient(): void {
  currentClient = null
  currentProvider = null
  resolving = null
}
