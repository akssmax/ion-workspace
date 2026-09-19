import { isDemoRuntime } from "@/lib/demo/runtime"
/**
 * App sidebar in the shadcn sidebar-09 layout ("collapsible nested
 * sidebars"): a slim icon rail (workspace, compose, app switcher, user
 * menu) plus a secondary panel with contextual navigation per app —
 * mailboxes, calendar views, file folders, address books.
 */

import {
  Archive,
  CalendarDays,
  FileEdit,
  FileText,
  Inbox,
  Mail,
  Plus,
  Send,
  Star,
  Trash2,
  Users,
  Settings,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NavUser } from "./nav-user"
import { IonLogo } from "@/components/brand/logo"
import { useWorkspaceStore  } from "@/stores/workspace.store"
import type {WorkspaceApp} from "@/stores/workspace.store";
import { useMailStore } from "@/stores/mail.store"
import { useCalendarStore  } from "@/stores/calendar.store"
import type {CalendarView} from "@/stores/calendar.store";
import { useFilesStore } from "@/stores/files.store"
import { useComposerStore } from "@/stores/composer.store"
import { useMailboxes, sortMailboxes } from "@/queries/mail"
import { useFeatureFlag } from "@/features/flags"
import { MailboxRow, NewFolderRow } from "@/modules/mail/mailboxes"
import { useAddressBooks, useContacts } from "@/queries/contacts"
import { Link } from "@tanstack/react-router"
import { useLanguage, type TranslationKey } from "@/lib/language"

const APPS: {
  id: WorkspaceApp
  label: string
  icon: React.ReactNode
}[] = [
  { id: "mail", label: "Mail", icon: <Mail className="size-4" /> },
  {
    id: "calendar",
    label: "Calendar",
    icon: <CalendarDays className="size-4" />,
  },
  { id: "contacts", label: "Contacts", icon: <Users className="size-4" /> },
  { id: "files", label: "Files", icon: <FileText className="size-4" /> },
]

const FOLDER_LABELS: Record<string, string> = {
  inbox: "Inbox",
  starred: "Starred",
  important: "Important",
  sent: "Sent",
  drafts: "Drafts",
  archive: "Archive",
  junk: "Junk",
  trash: "Trash",
}

const FOLDER_ICONS: Record<string, React.ReactNode> = {
  inbox: <Inbox className="size-4" />,
  starred: <Star className="size-4" />,
  sent: <Send className="size-4" />,
  drafts: <FileEdit className="size-4" />,
  archive: <Archive className="size-4" />,
  trash: <Trash2 className="size-4" />,
}

const CALENDAR_VIEWS: { id: CalendarView; label: string }[] = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
  { id: "agenda", label: "Agenda" },
]

export function SidebarShell() {
  const { t, direction } = useLanguage()
  const app = useWorkspaceStore((s) => s.app)
  const setApp = useWorkspaceStore((s) => s.setApp)
  const openCompose = useComposerStore((s) => s.openCompose)
  const { setOpen, toggleSidebar } = useSidebar()

  function pickApp(id: WorkspaceApp) {
    setApp(id)
    setOpen(true)
  }

  return (
    <Sidebar
      side={direction === "rtl" ? "right" : "left"}
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
    >
      {/* Icon rail — always visible. */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-e"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip={{ children: t("Toggle sidebar"), hidden: false }}
                onClick={toggleSidebar}
                className="md:h-8 md:p-0"
              >
                <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[oklch(0.88_0.22_125)] text-[oklch(0.2_0.05_125)]">
                  <IonLogo wordmark={false} size={16} />
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={{ children: t("Compose"), hidden: false }}
                    onClick={() => openCompose({ open: true, mode: "new" })}
                    className="px-2.5 md:px-2"
                  >
                    <Plus />
                    <span>{t("Compose")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {APPS.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      tooltip={{ children: t(item.label as TranslationKey), hidden: false }}
                      onClick={() => pickApp(item.id)}
                      isActive={app === item.id}
                      className="px-2.5 md:px-2"
                    >
                      {item.icon}
                      <span>{t(item.label as TranslationKey)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {!isDemoRuntime && <SidebarGroup className="mt-auto">
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={{ children: t("Settings"), hidden: false }}
                    render={
                      <Link to="/settings" search={{ section: "general" }} />
                    }
                    className="px-2.5 md:px-2"
                  >
                    <Settings />
                    <span>{t("Settings")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}
        </SidebarContent>
        <SidebarFooter>
          {isDemoRuntime ? (
            <div className="flex flex-col items-center gap-1 py-2" title="Alex Morgan · Sample account" aria-label="Alex Morgan, sample account">
              <Avatar>
                <AvatarFallback>AM</AvatarFallback>
              </Avatar>
            </div>
          ) : <NavUser />}
        </SidebarFooter>
      </Sidebar>

      {/* Secondary panel — contextual navigation per app. */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="h-14 shrink-0 flex-row items-center gap-2 border-b px-3 py-0">
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
          <PanelTitle app={app} />
        </SidebarHeader>
        <SidebarContent>
          {app === "mail" ? <MailboxPanel /> : null}
          {app === "calendar" ? <CalendarPanel /> : null}
          {app === "files" ? <FilesPanel /> : null}
          {app === "contacts" ? <ContactsPanel /> : null}
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}

function PanelTitle({ app }: { app: WorkspaceApp }) {
  const { t } = useLanguage()
  const { data: rawMailboxes } = useMailboxes()
  const totalUnread = (rawMailboxes ?? []).reduce(
    (sum, mb) => sum + (mb.unreadEmails ?? 0),
    0
  )
  const title =
    app === "mail"
      ? "Mailboxes"
      : app === "calendar"
        ? "Calendar"
        : app === "files"
          ? "Files"
          : "Contacts"
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="truncate text-sm font-medium">{t(title as TranslationKey)}</span>
      {app === "mail" && totalUnread > 0 ? (
        <span className="rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
          {totalUnread}
        </span>
      ) : null}
    </div>
  )
}

function MailboxPanel() {
  const { t } = useLanguage()
  const setApp = useWorkspaceStore((s) => s.setApp)
  const activeMailboxId = useMailStore((s) => s.activeMailboxId)
  const setActiveMailbox = useMailStore((s) => s.setActiveMailbox)
  const setSearchQuery = useMailStore((s) => s.setSearchQuery)
  const { data: rawMailboxes } = useMailboxes()
  const mailboxes = sortMailboxes(rawMailboxes ?? [])
  const folderManagement = useFeatureFlag("mail.mailboxes")

  function pickMailbox(id: string) {
    setSearchQuery("")
    setActiveMailbox(id)
    setApp("mail")
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {mailboxes.map((mb) => {
            const label = mb.role
              ? (FOLDER_LABELS[mb.role] ? t(FOLDER_LABELS[mb.role] as TranslationKey) : mb.name)
              : mb.name
            const icon = mb.role ? (
              (FOLDER_ICONS[mb.role] ?? <Inbox className="size-4" />)
            ) : (
              <Inbox className="size-4" />
            )
            if (folderManagement) {
              return (
                <MailboxRow
                  key={mb.id}
                  mailbox={mb}
                  label={label}
                  icon={icon}
                  active={activeMailboxId === mb.id}
                  onPick={pickMailbox}
                />
              )
            }
            return (
              <SidebarMenuItem key={mb.id}>
                <SidebarMenuButton
                  onClick={() => pickMailbox(mb.id)}
                  isActive={activeMailboxId === mb.id}
                >
                  {icon}
                  <span>{label}</span>
                </SidebarMenuButton>
                {(mb.unreadEmails ?? 0) > 0 ? (
                  <SidebarMenuBadge>{mb.unreadEmails}</SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
            )
          })}
          {folderManagement ? <NewFolderRow /> : null}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function CalendarPanel() {
  const { t } = useLanguage()
  const view = useCalendarStore((s) => s.view)
  const setView = useCalendarStore((s) => s.setView)
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("Views")}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {CALENDAR_VIEWS.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => setView(item.id)}
                isActive={view === item.id}
              >
                <span>{t(item.label as TranslationKey)}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function FilesPanel() {
  const { t } = useLanguage()
  const path = useFilesStore((s) => s.path)
  const navigateTo = useFilesStore((s) => s.navigateTo)
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("Folders")}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {path.map((node, i) => (
            <SidebarMenuItem key={`${node.id ?? "root"}-${i}`}>
              <SidebarMenuButton
                onClick={() => navigateTo(node)}
                isActive={i === path.length - 1}
              >
                <span className="truncate">{node.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function ContactsPanel() {
  const { t } = useLanguage()
  const setApp = useWorkspaceStore((s) => s.setApp)
  const { data: books } = useAddressBooks()
  const { data: contacts } = useContacts()
  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        {t("Address books")}
        {(contacts?.length ?? 0) > 0 ? ` · ${contacts?.length}` : ""}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {(books ?? []).map((book) => (
            <SidebarMenuItem key={book.id}>
              <SidebarMenuButton onClick={() => setApp("contacts")}>
                <Users className="size-4" />
                <span className="truncate">{book.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
