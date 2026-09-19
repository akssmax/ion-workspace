import { Link } from "@tanstack/react-router"
import { cn } from "cn"

export function DocsPage({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <article className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10 md:py-14">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground">
        {description}
      </p>
      <div className="mt-12 space-y-16">{children}</div>
    </article>
  )
}

export function DocsSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  )
}

export function DocsCardLink({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description?: string
}) {
  return (
    <Link
      to={href as never}
      className={cn(
        "flex flex-col rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/40"
      )}
    >
      <span className="text-sm font-medium">{title}</span>
      {description ? (
        <span className="mt-1 text-sm text-muted-foreground">{description}</span>
      ) : null}
    </Link>
  )
}

export function DocsFile({ path }: { path: string }) {
  return (
    <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
      {path}
    </code>
  )
}
