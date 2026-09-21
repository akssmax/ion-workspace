import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { AlertCircle, KeyRound, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  authenticate,
  fetchAppConfig,
  fetchSession,
} from "@/services/auth/auth.service"
import { useSession } from "@/hooks/use-session"
import { qk } from "@/queries/keys"
import { AuthBackground } from "@/components/effects/AuthBackground"
import { IonLogo } from "@/components/brand/logo"

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Sign in · Ion" }],
  }),
})

function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = useSession()
  const [username, setUsername] = useState("demo")
  const [password, setPassword] = useState("demo")
  const [mfaToken, setMfaToken] = useState("")
  const [needsMfa, setNeedsMfa] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  // Emails a hint with the configured demo credentials (mock mode only).
  useEffect(() => {
    void fetchAppConfig()
      .then((config) => {
        if (config.jmapMode === "mock") {
          setHint(
            `Mock mode — use ${config.mockUsername} / ${config.mockPassword}`
          )
        }
      })
      .catch(() => {})
  }, [])

  if (session.data) {
    return (
      <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-6 text-foreground">
        <AuthBackground />
        <div className="relative z-10">
          <RedirectToApp />
        </div>
      </div>
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const info = await authenticate(username, password, mfaToken)
      const persisted = await fetchSession()
      if (!persisted || persisted.userId !== info.userId) {
        throw new Error(
          "Sign in succeeded, but your session was not saved. Check that cookies are enabled and try again."
        )
      }
      queryClient.setQueryData(["session"], persisted)
      void queryClient.invalidateQueries({ queryKey: qk.preferences() })
      await navigate({ to: "/app", replace: true })
    } catch (err) {
      if (err instanceof Error && err.message.includes("second factor"))
        setNeedsMfa(true)
      setError(err instanceof Error ? err.message : "Sign in failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground">
      <AuthBackground />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border bg-card text-foreground">
            <IonLogo wordmark={false} size={22} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Sign in to Ion
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mail, calendar, contacts &amp; files.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border bg-card/95 p-6 shadow-2xl shadow-black/10 backdrop-blur-sm dark:shadow-black/40"
        >
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                className="pl-9"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                className="pl-9"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          {needsMfa ? (
            <div className="space-y-2">
              <Label htmlFor="mfa-token">Authentication code</Label>
              <Input
                id="mfa-token"
                value={mfaToken}
                onChange={(event) => setMfaToken(event.target.value)}
                autoComplete="one-time-code"
                inputMode="numeric"
              />
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <Button
            type="submit"
            className="w-full bg-foreground text-background hover:bg-foreground/90"
            disabled={busy}
          >
            {busy ? "Signing in…" : "Sign in"}
          </Button>

          {hint ? (
            <p className="text-center text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </form>
      </div>
    </main>
  )
}

function RedirectToApp() {
  const navigate = useNavigate()
  useEffect(() => {
    void navigate({ to: "/app", replace: true })
  }, [navigate])
  return <p className="text-sm text-muted-foreground">Redirecting…</p>
}
