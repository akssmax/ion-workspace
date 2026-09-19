import { CalendarDays, FileText, Mail, Users } from "lucide-react"
import { cn } from "cn"

export type PreviewSurface = "mail" | "calendar" | "contacts" | "files"

const THREADS = [
  {
    from: "Maya Chen",
    subject: "A fresh look at the next chapter",
    snippet: "A few ideas for our next project. What do you think?",
    time: "2m",
    unread: true,
    active: true,
  },
  {
    from: "The Studio",
    subject: "Your weekly reading list",
    snippet: "Something worth making time for this week.",
    time: "18m",
    unread: true,
    active: false,
  },
  {
    from: "Alex Rivera",
    subject: "Q3 planning notes",
    snippet: "Moved the calendar hold to Thursday 10:00.",
    time: "1h",
    unread: false,
    active: false,
  },
  {
    from: "Files",
    subject: "brand/logo.svg uploaded",
    snippet: "The latest assets are ready for your review.",
    time: "3h",
    unread: false,
    active: false,
  },
]

/**
 * Static recreation of the workspace. Used on the marketing page so
 * visitors see the product without signing in.
 */
export function ProductPreview({
  surface = "mail",
}: {
  surface?: PreviewSurface
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <span className="ms-3 font-mono text-[11px] tracking-wide text-muted-foreground">
          ion.app / {surface}
        </span>
      </div>
      {surface === "mail" ? <MailPreview /> : null}
      {surface === "calendar" ? <CalendarPreview /> : null}
      {surface === "contacts" ? <ContactsPreview /> : null}
      {surface === "files" ? <FilesPreview /> : null}
    </div>
  )
}

function Rail({ active }: { active: PreviewSurface }) {
  return (
    <div className="flex flex-col items-center gap-3 border-e border-border py-3">
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-md",
          active === "mail"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground"
        )}
      >
        <Mail className="size-3.5" />
      </span>
      <CalendarDays
        className={cn(
          "size-3.5",
          active === "calendar" ? "text-foreground" : "text-muted-foreground"
        )}
      />
      <Users
        className={cn(
          "size-3.5",
          active === "contacts" ? "text-foreground" : "text-muted-foreground"
        )}
      />
      <FileText
        className={cn(
          "size-3.5",
          active === "files" ? "text-foreground" : "text-muted-foreground"
        )}
      />
    </div>
  )
}

function MailPreview() {
  return (
    <div className="grid min-h-[340px] grid-cols-[44px_minmax(0,1fr)] md:grid-cols-[44px_168px_minmax(0,220px)_minmax(0,1fr)]">
      <Rail active="mail" />
      <div className="hidden border-e border-border p-3 md:block">
        <p className="mb-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Mailboxes
        </p>
        {[
          ["Inbox", "12"],
          ["Starred", ""],
          ["Sent", ""],
          ["Drafts", "2"],
          ["Archive", ""],
        ].map(([label, count], i) => (
          <div
            key={label}
            className={cn(
              "mb-0.5 flex items-center justify-between rounded-md px-2 py-1.5 text-[13px]",
              i === 0 ? "bg-muted text-foreground" : "text-muted-foreground"
            )}
          >
            <span>{label}</span>
            {count ? (
              <span className="font-mono text-[10px] text-muted-foreground">
                {count}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="border-e border-border">
        {THREADS.map((thread) => (
          <div
            key={thread.subject}
            className={cn(
              "border-b border-border px-3 py-2.5",
              thread.active && "bg-muted/60"
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span
                className={cn(
                  "truncate text-[13px]",
                  thread.unread
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {thread.from}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                {thread.time}
              </span>
            </div>
            <p
              className={cn(
                "truncate text-[12px]",
                thread.unread ? "text-foreground/85" : "text-muted-foreground"
              )}
            >
              {thread.subject}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {thread.snippet}
            </p>
          </div>
        ))}
      </div>
      <div className="hidden p-5 md:block">
        <p className="text-[11px] text-muted-foreground">
          Maya Chen · maya@studio
        </p>
        <h3 className="mt-1 text-[15px] font-medium">
          A fresh look at the next chapter
        </h3>
        <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-muted-foreground">
          <p>
            I’ve put together a few directions for the next chapter. The notes
            bring our ideas together, with a little room to explore something
            new.
          </p>
          <p>
            Take a look when you have a moment. We can walk through the details
            at Thursday’s design review. Looking forward to it!
          </p>
        </div>
      </div>
    </div>
  )
}

function CalendarPreview() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  return (
    <div className="grid min-h-[340px] grid-cols-[44px_minmax(0,1fr)]">
      <Rail active="calendar" />
      <div className="p-4">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          September 2026
        </p>
        <div className="mt-3 grid grid-cols-7 gap-px rounded-lg border border-border bg-border">
          {days.map((d) => (
            <div
              key={d}
              className="bg-card px-1 py-1.5 text-center font-mono text-[10px] text-muted-foreground"
            >
              {d}
            </div>
          ))}
          {Array.from({ length: 35 }, (_, i) => (
            <div
              key={i}
              className="min-h-12 bg-card p-1.5 text-[11px] text-muted-foreground"
            >
              {i > 0 && i <= 30 ? i : ""}
              {i === 17 ? (
                <span className="mt-1 block truncate rounded bg-primary/15 px-1 text-[10px] text-primary">
                  Design review
                </span>
              ) : null}
              {i === 23 ? (
                <span className="mt-1 block truncate rounded bg-muted px-1 text-[10px]">
                  Q3 planning
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ContactsPreview() {
  const people = [
    ["Maya Chen", "maya@studio"],
    ["Alex Rivera", "alex@north"],
    ["Sally Rhodes", "sally@work"],
    ["Nina Kowalski", "nina@later"],
  ]
  return (
    <div className="grid min-h-[340px] grid-cols-[44px_minmax(0,1fr)]">
      <Rail active="contacts" />
      <div className="p-4">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Address book
        </p>
        <div className="mt-3 divide-y divide-border rounded-lg border border-border">
          {people.map(([name, email]) => (
            <div key={email} className="flex items-center gap-3 px-3 py-2.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-muted text-[11px] font-medium">
                {name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">{name}</p>
                <p className="truncate text-[12px] text-muted-foreground">
                  {email}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FilesPreview() {
  const files = [
    ["brand/logo.svg", "2 KB"],
    ["Q3-planning.pdf", "840 KB"],
    ["review-notes.md", "12 KB"],
    ["hero-cut.png", "1.1 MB"],
  ]
  return (
    <div className="grid min-h-[340px] grid-cols-[44px_minmax(0,1fr)]">
      <Rail active="files" />
      <div className="p-4">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Files
        </p>
        <div className="mt-3 divide-y divide-border rounded-lg border border-border">
          {files.map(([name, size]) => (
            <div
              key={name}
              className="flex items-center justify-between px-3 py-2.5 text-[13px]"
            >
              <span className="flex items-center gap-2 truncate">
                <FileText className="size-3.5 text-muted-foreground" />
                {name}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {size}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
