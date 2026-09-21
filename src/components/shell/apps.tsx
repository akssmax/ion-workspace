import { CalendarDays, FileText, Mail, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { WorkspaceApp } from "@/stores/workspace.store"

export interface WorkspaceAppMeta {
  id: WorkspaceApp
  label: string
  icon: LucideIcon
}

/** The apps a workspace can switch between, shared by the rail and mobile nav. */
export const APPS: WorkspaceAppMeta[] = [
  { id: "mail", label: "Mail", icon: Mail },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "files", label: "Files", icon: FileText },
]
