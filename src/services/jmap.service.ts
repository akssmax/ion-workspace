/**
 * Provides the active JMAP client to the rest of the app.
 *
 * Responsibilities:
 *  - select the provider based on server config (mock vs real)
 *  - own a process-wide singleton client
 *  - allow reset on logout/account switch
 */

import { getAppConfig } from "../server/auth.rpc"
import type { JmapClient } from "../jmap/client/JmapClient"
import { isDemoRuntime } from "@/lib/demo/runtime"

import { resolvePrimaryAccountId } from "../jmap/provider/provider"
import type { JmapProvider } from "../jmap/provider/provider"
import { JMAP_CAPS } from "../jmap/types"

let currentClient: JmapClient | null = null
let currentProvider: JmapProvider | null = null
let resolving: Promise<JmapClient> | null = null

export async function getJmapClient(): Promise<JmapClient> {
  if (currentClient) return currentClient
  if (!resolving) {
    resolving = (async () => {
      const config = isDemoRuntime
        ? { jmapMode: "mock" as const, publicEventSourceUrl: undefined }
        : await getAppConfig()
      if (config.jmapMode === "real") {
        const { RealJmapProvider } =
          await import("../jmap/provider/RealJmapProvider")
        currentProvider = new RealJmapProvider({
          publicEventSourceUrl: config.publicEventSourceUrl,
        })
      } else {
        const { MockJmapProvider } =
          await import("../jmap/provider/MockJmapProvider")
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
