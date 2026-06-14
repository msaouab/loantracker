"use client";

import { useCallback, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useResetOnClose } from "@/hooks/use-reset-on-close";
import { deleteAdminUser } from "@/lib/admin-client";

type DeleteUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  fullName?: string;
  onDeleted?: () => void;
};

export function DeleteUserDialog({
  open,
  onOpenChange,
  userId,
  fullName,
  onDeleted,
}: DeleteUserDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetError = useCallback(() => setError(null), []);
  useResetOnClose(open, resetError);

  async function handleConfirm() {
    if (!userId) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteAdminUser(userId);
      onOpenChange(false);
      onDeleted?.();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete user"
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Remove user account?</AlertDialogTitle>
          <AlertDialogDescription>
            {fullName
              ? `This will permanently delete ${fullName}'s account and all associated loan records. This action cannot be undone.`
              : "This will permanently delete this user account and all associated loan records. This action cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deleting || !userId}
            onClick={handleConfirm}
          >
            {deleting ? "Removing..." : "Remove user"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
