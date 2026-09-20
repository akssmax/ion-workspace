/**
 * Files: Drive-style browser over the FileNode tree.
 *
 * - Breadcrumb navigation; folders open in place.
 * - Grid and list views.
 * - Sort (name/size/type/modified), filter (folders/images/PDF/docs/media),
 *   in-folder search and pagination.
 * - Files open in the shared DocumentViewer (same preview as mail).
 */

import { useEffect, useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  FolderPlus,
  Home,
  LayoutGrid,
  List,
  MoreVertical,
  Pencil,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "cn"
import { useFilesStore } from "@/stores/files.store"
import {
  useFiles,
  useCreateFolder,
  useUploadFile,
  useDeleteNode,
  useRenameNode,
  useDownloadFileNode,
  useFileNodes,
} from "@/queries/files"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/dates"
import type { FileNode } from "@/jmap/types/files"
import {
  filterAndSortFiles,
  nodeKind,
} from "@/lib/file-browser"
import type { FileFilterKey, FileSortKey } from "@/lib/file-browser"
import { loadFileBlob } from "@/services/files/files.service"
import { OpenSidebarTrigger } from "@/components/shell/open-sidebar-trigger"
import {
  AttachmentThumb,
  DocumentViewer,
  fileNodeSource,
  formatFileSize,
} from "@/components/viewer"

type ViewMode = "grid" | "list"
type SortKey = FileSortKey
type FilterKey = FileFilterKey

const SORT_LABELS: Record<SortKey, string> = {
  name: "Name",
  modified: "Last modified",
  size: "Size",
  type: "Type",
}

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "All items",
  folders: "Folders",
  files: "Files",
  images: "Images",
  pdfs: "PDFs",
  documents: "Documents",
  media: "Media",
}

const PAGE_SIZES = [24, 48, 96]

const KIND_ICONS: Record<string, LucideIcon> = {
  image: FileImage,
  pdf: FileText,
  text: FileCode,
  docx: FileText,
  sheet: FileSpreadsheet,
  media: FileVideo,
  unsupported: FileIcon,
}

function nodeIcon(node: FileNode): LucideIcon {
  if (!node.isFile) return Folder
  const kind = nodeKind(node)
  if (kind === "media")
    return /^video/.test(node.contentType ?? "") ? FileVideo : FileAudio
  return KIND_ICONS[kind] ?? FileArchive
}

export function FilesView() {
  const path = useFilesStore((s) => s.path)
  const navigateTo = useFilesStore((s) => s.navigateTo)
  const getId = useFilesStore((s) => s.getId)
  const parentId = getId()

  const query = useFiles(parentId)
  const allNodes = useFileNodes()
  const createFolder = useCreateFolder()
  const uploadFile = useUploadFile()
  const deleteNode = useDeleteNode()
  const renameNode = useRenameNode()
  const download = useDownloadFileNode()

  const [view, setView] = useState<ViewMode>("grid")
  const [sort, setSort] = useState<SortKey>("name")
  const [direction, setDirection] = useState<"asc" | "desc">("asc")
  const [filter, setFilter] = useState<FilterKey>("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])
  const [busy, setBusy] = useState(false)

  const [folderDialog, setFolderDialog] = useState(false)
  const [folderName, setFolderName] = useState("")
  const [renameTarget, setRenameTarget] = useState<FileNode | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  useEffect(() => {
    setPage(0)
  }, [parentId, sort, direction, filter, search, pageSize])

  const filtered = useMemo(
    () =>
      filterAndSortFiles(query.data ?? [], {
        filter,
        search,
        sort,
        direction,
      }),
    [query.data, filter, search, sort, direction]
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const pageItems = filtered.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize
  )

  const fileNodes = useMemo(
    () => filtered.filter((node) => node.isFile),
    [filtered]
  )
  const sources = useMemo(
    () => fileNodes.map((node) => fileNodeSource(node, (n) => loadFileBlob(n))),
    [fileNodes]
  )
  const openPreview = (node: FileNode) => {
    const index = fileNodes.findIndex((item) => item.id === node.id)
    if (index >= 0) setPreviewIndex(index)
  }

  async function downloadNode(node: FileNode) {
    setBusy(true)
    try {
      const blob = await download.mutateAsync(node)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = node.name
      anchor.click()
      URL.revokeObjectURL(url)
    } catch {
      // ignore download errors
    } finally {
      setBusy(false)
    }
  }

  async function removeNode(node: FileNode) {
    const label = node.isFile ? "file" : "folder"
    if (!window.confirm(`Delete ${label} "${node.name}"?`)) return
    try {
      await deleteNode.mutateAsync(node.id)
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Could not delete this item."
      )
    }
  }

  function startRename(node: FileNode) {
    setRenameTarget(node)
    setRenameValue(node.name)
  }

  async function submitRename() {
    if (!renameTarget || !renameValue.trim()) return
    try {
      await renameNode.mutateAsync({
        id: renameTarget.id,
        name: renameValue.trim(),
      })
      setRenameTarget(null)
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Could not rename this item."
      )
    }
  }

  function ItemActions({ node }: { node: FileNode }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${node.name}`}
            />
          }
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {node.isFile ? (
            <DropdownMenuItem onClick={() => void downloadNode(node)}>
              <Download className="size-4" /> Download
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => navigateTo({ id: node.id, name: node.name })}
            >
              <Folder className="size-4" /> Open
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => startRename(node)}>
            <Pencil className="size-4" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => void removeNode(node)}
          >
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const Icon = view === "grid" ? LayoutGrid : List
  const total = filtered.length

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 sm:px-4">
        <OpenSidebarTrigger />
        <h1 className="text-sm font-semibold">Files</h1>
        <nav className="order-last flex w-full min-w-0 items-center gap-1 overflow-x-auto text-sm sm:order-none sm:ml-4 sm:w-auto sm:flex-1">
          {path.map((p, i) => (
            <span key={p.id ?? "root"} className="flex min-w-0 items-center gap-1">
              {i > 0 ? (
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />
              ) : null}
              <button
                onClick={() => navigateTo(p)}
                className={cn(
                  "flex items-center gap-1 truncate rounded px-1.5 py-0.5 hover:bg-muted",
                  i === path.length - 1
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {i === 0 ? <Home className="size-3.5 shrink-0" /> : null}
                {p.name}
              </button>
            </span>
          ))}
        </nav>
        <div className="ms-auto flex flex-wrap items-center gap-1.5">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 start-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in folder"
              aria-label="Search files"
              className="h-8 w-40 ps-8 sm:w-52"
            />
            {search ? (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute top-1/2 end-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" aria-label="Filter files" />
              }
            >
              <SlidersHorizontal className="size-4" />{" "}
              <span className="hidden sm:inline">{FILTER_LABELS[filter]}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => (
                <DropdownMenuItem key={key} onClick={() => setFilter(key)}>
                  <span className="flex-1">{FILTER_LABELS[key]}</span>
                  {filter === key ? <Check className="size-4" /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" aria-label="Sort files" />
              }
            >
              <ArrowUpDown className="size-4" />
              <span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => {
                    if (sort === key)
                      setDirection((d) => (d === "asc" ? "desc" : "asc"))
                    else setSort(key)
                  }}
                >
                  <span className="flex-1">{SORT_LABELS[key]}</span>
                  {sort === key ? (
                    direction === "asc" ? (
                      <ArrowUp className="size-4" />
                    ) : (
                      <ArrowDown className="size-4" />
                    )
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={view === "grid" ? "Switch to list view" : "Switch to grid view"}
            onClick={() => setView((v) => (v === "grid" ? "list" : "grid"))}
          >
            <Icon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Refresh"
            onClick={() => void allNodes.refetch()}
          >
            <RefreshCw className="size-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={() => setFolderDialog(true)}>
            <FolderPlus className="size-4" />
            <span className="hidden sm:inline">New folder</span>
          </Button>
          <label
            aria-label="Upload files"
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
          >
            <Upload className="size-4" />
            <span className="hidden sm:inline">Upload</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = [...(e.target.files ?? [])]
                e.target.value = ""
                for (const file of files)
                  await uploadFile.mutateAsync({ file, parentId })
              }}
            />
          </label>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {query.isLoading ? (
          <div
            className={cn(
              "p-4",
              view === "grid"
                ? "grid auto-rows-min grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3"
                : "space-y-2"
            )}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className={view === "grid" ? "h-28" : "h-12"} />
            ))}
          </div>
        ) : query.isError ? (
          <div className="flex h-40 flex-col items-center justify-center gap-3 text-sm">
            <p className="text-destructive">Could not load this folder.</p>
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Folder />}
            tone={search || filter !== "all" ? "noResults" : "neutral"}
            title={
              search || filter !== "all"
                ? "No matching items"
                : "This folder is empty"
            }
            description={
              search || filter !== "all"
                ? "Try a different search or filter."
                : "Upload files or create a folder to get started."
            }
            action={
              !search && filter === "all" ? (
                <Button size="sm" onClick={() => setFolderDialog(true)}>
                  <FolderPlus className="size-4" /> New folder
                </Button>
              ) : undefined
            }
            className="min-h-72 rounded-none border-0"
          />
        ) : view === "grid" ? (
          <div className="grid auto-rows-min grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 p-4">
            {pageItems.map((node) => {
              const isImage =
                node.isFile &&
                nodeKind(node) === "image" &&
                (node.size ?? 0) <= 8 * 1024 * 1024
              const sourceIndex = fileNodes.findIndex((f) => f.id === node.id)
              const NodeIcon = nodeIcon(node)
              return (
                <div
                  key={node.id}
                  className="group flex flex-col rounded-xl border bg-card p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start gap-1">
                    <div className="min-w-0 flex-1">
                      {node.isFile && isImage && sourceIndex >= 0 ? (
                        <AttachmentThumb
                          source={sources[sourceIndex]}
                          onOpen={() => openPreview(node)}
                          className="h-24 w-full"
                        />
                      ) : (
                        <button
                          onClick={() =>
                            node.isFile
                              ? openPreview(node)
                              : navigateTo({ id: node.id, name: node.name })
                          }
                          className="flex h-24 w-full items-center justify-center rounded-lg bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/60"
                          aria-label={`Open ${node.name}`}
                        >
                          <NodeIcon
                            className={cn(
                              "size-9",
                              !node.isFile && "text-primary"
                            )}
                          />
                        </button>
                      )}
                    </div>
                    <ItemActions node={node} />
                  </div>
                  <button
                    onClick={() =>
                      node.isFile
                        ? openPreview(node)
                        : navigateTo({ id: node.id, name: node.name })
                    }
                    className="mt-2 min-w-0 text-left"
                  >
                    <p className="w-full truncate text-sm font-medium">{node.name}</p>
                  </button>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="min-w-0 flex-1 truncate">
                      {node.isFile ? formatFileSize(node.size) : "Folder"}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {node.modifiedAt ? formatDate(node.modifiedAt, "MMM d") : ""}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Size</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">
                  Modified
                </th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((node) => {
                const NodeIcon = nodeIcon(node)
                return (
                  <tr
                    key={node.id}
                    className="border-b last:border-0 hover:bg-muted/40"
                  >
                    <td className="max-w-0 px-3 py-2">
                      <button
                        onClick={() =>
                          node.isFile
                            ? openPreview(node)
                            : navigateTo({ id: node.id, name: node.name })
                        }
                        className="flex w-full min-w-0 items-center gap-2 text-left"
                      >
                        <NodeIcon
                          className={cn(
                            "size-4 shrink-0",
                            node.isFile ? "text-muted-foreground" : "text-primary"
                          )}
                        />
                        <span className="truncate">{node.name}</span>
                      </button>
                    </td>
                    <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">
                      {node.isFile ? formatFileSize(node.size) : "—"}
                    </td>
                    <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">
                      {node.modifiedAt ? formatDate(node.modifiedAt, "MMM d, yyyy") : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end">
                        <ItemActions node={node} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {total === 0
            ? "0 items"
            : `${safePage * pageSize + 1}–${Math.min(
                (safePage + 1) * pageSize,
                total
              )} of ${total}`}
        </span>
        <span className="ms-auto" />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="sm" aria-label="Rows per page" />}
          >
            {pageSize} / page
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {PAGE_SIZES.map((size) => (
              <DropdownMenuItem key={size} onClick={() => setPageSize(size)}>
                <span className="flex-1">{size} / page</span>
                {pageSize === size ? <Check className="size-4" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Previous page"
          disabled={safePage <= 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="tabular-nums">
          Page {safePage + 1} of {pageCount}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Next page"
          disabled={safePage >= pageCount - 1}
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </footer>

      <Dialog open={folderDialog} onOpenChange={setFolderDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!folderName.trim()) return
              void createFolder.mutateAsync({
                name: folderName.trim(),
                parentId,
              })
              setFolderName("")
              setFolderDialog(false)
            }}
          >
            <Input
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder name…"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFolderDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!folderName.trim()}>
                <FolderPlus className="size-4" />
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              void submitRename()
            }}
          >
            <Input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRenameTarget(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!renameValue.trim()}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DocumentViewer
        open={previewIndex !== null}
        onOpenChange={(value) => {
          if (!value) setPreviewIndex(null)
        }}
        items={sources}
        index={previewIndex ?? 0}
        onIndexChange={setPreviewIndex}
        title="Files"
      />
      {busy ? <span className="sr-only">Downloading…</span> : null}
    </div>
  )
}
