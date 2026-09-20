/**
 * Account settings: profile summary, mail server connection health, and
 * usage limits reported by the connected Stalwart account.
 */

import { useState } from "react"
import {
  Check,
  ChevronDown,
  HardDrive,
  Loader2,
  LogOut,
  RefreshCw,
  Server,
} from "lucide-react"
import { useRouter } from "@tanstack/react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { useSession } from "@/hooks/use-session"
import { signOut } from "@/services/auth/auth.service"
import { qk } from "@/queries/keys"
import { getMailConnectionStatus } from "@/server/mail-connection.rpc"
import type { MailQuota } from "@/server/mail-connection.rpc"
import { cn } from "cn"

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB", "PB"]
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  )
  const value = bytes / 1024 ** index
  return `${value >= 100 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`
}

function formatQuotaValue(resourceType: string, value: number): string {
  return resourceType === "octets"
    ? formatBytes(value)
    : new Intl.NumberFormat().format(value)
}

function quotaLabel(quota: MailQuota): string {
  if (quota.name) return quota.name
  if (quota.resourceType === "octets") return "Storage"
  if (quota.resourceType === "count") return "Items"
  return quota.resourceType
}

function quotaPercent(quota: MailQuota): number | null {
  if (quota.hardLimit === null || quota.hardLimit <= 0) return null
  return Math.min(100, Math.round((quota.used / quota.hardLimit) * 100))
}

const KNOWN_TOKENS: Record<string, string> = {
  vacationresponse: "Vacation response",
  websocket: "WebSocket",
  emailpush: "Email push",
  "webpush-vapid": "Web push (VAPID)",
  filenode: "File storage",
  "principals:availability": "Principal availability",
}

function humanizeToken(token: string): string {
  const short = token
    .replace(/^urn:ietf:params:jmap:/, "")
    .replace(/^jmap-/, "")
  if (KNOWN_TOKENS[short]) return KNOWN_TOKENS[short]
  return short
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[-_:]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function QuotaBar({ quota }: { quota: MailQuota }) {
  const percent = quotaPercent(quota)
  const remaining =
    quota.hardLimit !== null ? Math.max(0, quota.hardLimit - quota.used) : null
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-sm font-medium">
          {quotaLabel(quota)}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatQuotaValue(quota.resourceType, quota.used)}
          {quota.hardLimit !== null
            ? ` of ${formatQuotaValue(quota.resourceType, quota.hardLimit)}`
            : ""}
        </span>
      </div>
      {percent !== null ? (
        <div
          role="progressbar"
          aria-label={`${quotaLabel(quota)} usage`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width]",
              percent >= 90
                ? "bg-destructive"
                : percent >= 75
                  ? "bg-amber-500"
                  : "bg-primary"
            )}
            style={{ width: `${Math.max(2, percent)}%` }}
          />
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <span>
          {percent !== null ? `${percent}% used` : "No hard limit set"}
        </span>
        {remaining !== null ? (
          <span>
            {formatQuotaValue(quota.resourceType, remaining)} remaining
          </span>
        ) : null}
      </div>
    </div>
  )
}

function ConnectionDetails({
  capabilities,
  permissions,
}: {
  capabilities: string[]
  permissions: string[]
}) {
  const selfService = permissions.filter((permission) =>
    /identity|vacation|sieve/.test(permission)
  )
  return (
    <Collapsible>
      <CollapsibleTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="group -ml-2 h-7 px-2 text-xs text-muted-foreground"
          />
        }
      >
        Connection details
        <ChevronDown className="size-3.5 transition-transform group-data-[panel-open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium">Capabilities</p>
          <div className="flex flex-wrap gap-1">
            {capabilities.length ? (
              capabilities.map((capability) => (
                <Badge
                  key={capability}
                  variant="secondary"
                  className="font-normal"
                >
                  {humanizeToken(capability)}
                </Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                Not reported by this server.
              </p>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium">Self-service permissions</p>
          <div className="flex flex-wrap gap-1">
            {selfService.length ? (
              selfService.map((permission) => (
                <Badge
                  key={permission}
                  variant="outline"
                  className="font-normal"
                >
                  {humanizeToken(permission)}
                </Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">None granted.</p>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function AccountSection() {
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()
  const session = useSession()
  const connection = useQuery({
    queryKey: ["mail-connection", session.data?.userId],
    queryFn: getMailConnectionStatus,
    enabled: !!session.data,
    retry: false,
  })

  const email = session.data?.email ?? ""
  const name = session.data?.username ?? (email || "Signed out")

  const status = connection.data
  const connected = status?.connected === true
  const isMock = status?.mode === "mock"

  async function handleSignOut() {
    await signOut()
    queryClient.clear()
    queryClient.setQueryData(["session"], null)
    queryClient.setQueryData(qk.preferences(), {})
    router.invalidate()
    void router.navigate({ to: "/" })
  }

  async function copyAccountId() {
    if (!status?.accountId) return
    try {
      await navigator.clipboard.writeText(status.accountId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable: the id stays selectable in the UI.
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex items-center gap-4 rounded-xl border bg-card p-4">
        <Avatar className="h-12 w-12 rounded-xl">
          <AvatarFallback className="rounded-xl text-base">
            {initials(name) || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </section>

      <Separator />

      <section className="space-y-4 rounded-xl border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <h3 className="text-sm font-semibold">Mail server connection</h3>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Server className="size-3.5" />
              {connection.isLoading
                ? "Checking connection…"
                : isMock
                  ? "Demo mail server"
                  : connected
                    ? "Connected to Stalwart"
                    : "Stalwart connection unavailable"}
            </p>
          </div>
          {connection.isLoading ? (
            <Badge
              variant="secondary"
              className="gap-1.5 font-normal text-muted-foreground"
            >
              <Loader2 className="size-3 animate-spin" />
              Checking
            </Badge>
          ) : connected ? (
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 font-normal",
                isMock
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  isMock ? "bg-amber-500" : "bg-emerald-500"
                )}
              />
              {isMock ? "Demo" : "Connected"}
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1.5 font-normal">
              <span className="size-1.5 rounded-full bg-destructive" />
              Offline
            </Badge>
          )}
        </div>

        {status?.error ? (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {status.error}
          </p>
        ) : connection.isError ? (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            Could not reach the mail server. Try checking the connection again.
          </p>
        ) : null}

        {status?.accountId ? (
          <button
            type="button"
            onClick={() => void copyAccountId()}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2 text-left transition-colors hover:bg-muted/50"
          >
            <span className="min-w-0">
              <span className="block text-[11px] tracking-wide text-muted-foreground uppercase">
                Mail account
              </span>
              <span className="block truncate font-mono text-xs">
                {status.accountId}
              </span>
            </span>
            {copied ? (
              <Check className="size-3.5 shrink-0 text-emerald-500" />
            ) : null}
          </button>
        ) : null}

        {connected && status.quotas.length ? (
          <div className="space-y-4 rounded-lg bg-muted/40 p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium">
              <HardDrive className="size-3.5" />
              Usage limits
            </p>
            <div className="space-y-4">
              {status.quotas.map((quota) => (
                <QuotaBar key={quota.id} quota={quota} />
              ))}
            </div>
          </div>
        ) : connected && !connection.isLoading ? (
          <p className="text-xs text-muted-foreground">
            This server does not report usage limits over JMAP.
          </p>
        ) : null}

        {status && (status.capabilities.length || status.permissions.length) ? (
          <ConnectionDetails
            capabilities={status.capabilities}
            permissions={status.permissions}
          />
        ) : null}

        <Button
          variant="outline"
          size="sm"
          disabled={connection.isFetching}
          onClick={() => void connection.refetch()}
        >
          <RefreshCw
            className={cn("size-3.5", connection.isFetching && "animate-spin")}
          />
          Check connection
        </Button>
      </section>

      <Separator />

      <section className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Sign out</p>
          <p className="text-xs text-muted-foreground">
            Ends this session on this device.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleSignOut()}
        >
          <LogOut className="size-3.5" />
          Log out
        </Button>
      </section>
    </div>
  )
}
