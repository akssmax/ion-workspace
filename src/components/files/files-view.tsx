/**
 * Files: breadcrumb navigation over the node tree, upload & folder creation.
 */

import { useState } from "react"
import {
  Upload,
  FolderPlus,
  Folder,
  File as FileIcon,
  Trash2,
  Download,
  Home,
  ChevronRight,
} from "lucide-react"
import { cn } from "cn"
import { useFilesStore } from "@/stores/files.store"
import {
  useFiles,
  useCreateFolder,
  useUploadFile,
  useDeleteNode,
  useDownloadFileNode,
} from "@/queries/files"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/dates"
import type { FileNode } from "@/jmap/types/files"
import { OpenSidebarTrigger } from "@/components/shell/open-sidebar-trigger"

export function FilesView() {
  const path = useFilesStore((s) => s.path)
  const navigateTo = useFilesStore((s) => s.navigateTo)
  const getId = useFilesStore((s) => s.getId)

  const parentId = getId()
  const { data: nodes, isLoading } = useFiles(parentId)
  const createFolder = useCreateFolder()
  const uploadFile = useUploadFile()
  const deleteNode = useDeleteNode()
  const download = useDownloadFileNode()

  const [folderDialog, setFolderDialog] = useState(false)
  const [folderName, setFolderName] = useState("")
  const [busy, setBusy] = useState(false)

  function fmtSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  async function downloadNode(node: FileNode) {
    setBusy(true)
    try {
      const blob = await download.mutateAsync(node)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = node.name
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // ignore download errors
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 sm:px-4">
        <OpenSidebarTrigger />
        <h1 className="text-sm font-semibold">Files</h1>
        <nav className="order-last flex w-full min-w-0 items-center gap-1 overflow-x-auto text-sm sm:order-none sm:ml-4 sm:w-auto sm:flex-1">
          <button
            onClick={() => navigateTo({ id: null, name: "My Files" })}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Home className="size-3.5" />
            My Files
          </button>
          {path.slice(1).map((p) => (
            <span
              key={p.id ?? "root"}
              className="flex min-w-0 items-center gap-1"
            >
              <ChevronRight className="size-3.5 text-muted-foreground/50" />
              <button
                onClick={() => navigateTo(p)}
                className={cn(
                  "truncate rounded px-1.5 py-0.5 hover:bg-muted",
                  p.id === path[path.length - 1].id &&
                    "font-medium text-foreground"
                )}
              >
                {p.name}
              </button>
            </span>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFolderDialog(true)}
            aria-label="New folder"
          >
            <FolderPlus className="size-4" />
            <span className="hidden sm:inline">New folder</span>
          </Button>
          <label aria-label="Upload files" className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-4xl bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-50">
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

      <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 overflow-y-auto p-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))
        ) : nodes && nodes.length > 0 ? (
          [...nodes]
            .sort(
              (a, b) =>
                Number(a.isFile) - Number(b.isFile) ||
                a.name.localeCompare(b.name)
            )
            .map((node) => (
              <div
                key={node.id}
                className="group flex flex-col rounded-xl border bg-card p-3 transition-colors hover:bg-muted/40"
              >
                {node.isFile ? (
                  <button
                    onClick={() => void downloadNode(node)}
                    className="flex min-w-0 flex-col items-start text-left"
                  >
                    <FileIcon className="size-8 text-muted-foreground" />
                    <p className="mt-2 w-full truncate text-sm font-medium">
                      {node.name}
                    </p>
                  </button>
                ) : (
                  <button
                    onClick={() => navigateTo({ id: node.id, name: node.name })}
                    className="flex min-w-0 flex-col items-start text-left"
                  >
                    <Folder className="size-8 text-primary" />
                    <p className="mt-2 w-full truncate text-sm font-medium">
                      {node.name}
                    </p>
                  </button>
                )}
                <div className="mt-2 flex w-full items-center gap-2 text-xs text-muted-foreground">
                  <span className="min-w-0 flex-1 truncate">
                    {node.isFile
                      ? fmtSize(node.size)
                      : node.childNodeIds?.length
                        ? `${node.childNodeIds.length} items`
                        : "Empty"}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {node.modifiedAt
                      ? formatDate(node.modifiedAt, "MMM d")
                      : ""}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {!node.isFile ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Download ${node.name}`}
                      disabled
                    >
                      <Download className="size-3.5" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Download ${node.name}`}
                      disabled={busy}
                      onClick={() => void downloadNode(node)}
                    >
                      <Download className="size-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${node.name}`}
                    onClick={async () => {
                      if (!window.confirm(`Delete "${node.name}"?`)) return
                      await deleteNode.mutateAsync(node.id)
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))
        ) : (
          <div className="col-span-full flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <Folder className="size-8 text-muted-foreground/40" />
            <p>This folder is empty.</p>
          </div>
        )}
      </div>

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
            <div className="flex justify-end gap-2">
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
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
