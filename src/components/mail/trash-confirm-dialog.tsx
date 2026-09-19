import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export const trashIconButtonClassName =
  "hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20"

export function TrashConfirmDialog({
  open,
  onOpenChange,
  count = 1,
  onConfirm,
  permanent = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  count?: number
  onConfirm: () => void
  permanent?: boolean
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{permanent ? "Delete permanently?" : "Move to trash?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {permanent
              ? `${count} conversation${count === 1 ? "" : "s"} will be permanently deleted. This cannot be undone.`
              : count > 1
              ? `${count} conversations will be moved to trash.`
              : "This conversation will be moved to trash."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {permanent ? "Delete permanently" : "Move to trash"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
