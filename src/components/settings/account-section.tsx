/**
 * Account settings: profile summary and session controls.
 */

import { LogOut } from "lucide-react"
import { useRouter } from "@tanstack/react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSession } from "@/hooks/use-session"
import { signOut } from "@/services/auth/auth.service"
import { qk } from "@/queries/keys"
import { getMailConnectionStatus } from "@/server/mail-connection.rpc"

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function AccountSection() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const session = useSession()
  const connection = useQuery({ queryKey: ["mail-connection", session.data?.userId], queryFn: getMailConnectionStatus, enabled: !!session.data, retry: false })

  const email = session.data?.email ?? ""
  const name = session.data?.username ?? (email || "Signed out")

  async function handleSignOut() {
    await signOut()
    queryClient.clear()
    queryClient.setQueryData(["session"], null)
    queryClient.setQueryData(qk.preferences(), {})
    router.invalidate()
    void router.navigate({ to: "/" })
  }

  return (
    <div className="space-y-5">
      <section className="flex items-center gap-4 rounded-xl border p-4">
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

      <section className="space-y-2 rounded-xl border p-4">
        <h3 className="text-sm font-semibold">Mail server connection</h3>
        <p className="text-sm">{connection.data?.mode === "mock" ? "Demo mail server" : connection.data?.connected ? "Connected to Stalwart" : "Stalwart connection unavailable"}</p>
        {connection.data?.accountId ? <p className="break-all text-xs text-muted-foreground">Mail account: {connection.data.accountId}</p> : null}
        {connection.data?.error ? <p role="alert" className="text-xs text-destructive">{connection.data.error}</p> : null}
        {connection.data?.capabilities.length ? <p className="break-all text-xs text-muted-foreground">Capabilities: {connection.data.capabilities.join(", ")}</p> : null}
        {connection.data?.permissions.length ? <p className="text-xs text-muted-foreground">Self-service permissions: {connection.data.permissions.filter(permission => /identity|vacation|sieve/.test(permission)).join(", ") || "None granted"}</p> : null}
        <Button variant="outline" size="sm" onClick={() => void connection.refetch()}>Check connection</Button>
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
