import { createFileRoute } from "@tanstack/react-router"
import { KeyRound, ShieldCheck, User } from "lucide-react"
import { DocsFile, DocsPage, DocsSection } from "@/components/design-system/page"
import { Playground } from "@/components/design-system/playground"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const Route = createFileRoute("/design-system/auth")({
  component: AuthPage,
  head: () => ({
    meta: [{ title: "Auth · Design System" }],
  }),
})

function SignInCard() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-6" />
        </div>
        <h1 className="text-xl font-semibold">Workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mail, calendar, contacts &amp; files.
        </p>
      </div>
      <form
        className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="space-y-2">
          <Label htmlFor="ds-username">Username</Label>
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="ds-username" className="pl-9" defaultValue="demo" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ds-password">Password</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="ds-password"
              className="pl-9"
              type="password"
              defaultValue="demo"
            />
          </div>
        </div>
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>
    </div>
  )
}

function AuthPage() {
  return (
    <DocsPage
      title="Auth"
      description="Sign-in card without the FaultyTerminal background. The live page is src/routes/login.tsx."
    >
      <DocsSection title="Source">
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <DocsFile path="src/routes/login.tsx" />
          </li>
          <li>
            <DocsFile path="src/components/effects/AuthBackground.tsx" /> — WebGL
            wash, not used here
          </li>
        </ul>
      </DocsSection>
      <DocsSection title="Sign-in card">
        <Playground
          title="Login form"
          canvasClassName="w-full py-12"
          render={() => <SignInCard />}
          code={() =>
            `<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">\n  <ShieldCheck />\n</div>\n<form className="space-y-4 rounded-2xl border bg-card p-6">…</form>`
          }
        />
      </DocsSection>
    </DocsPage>
  )
}
