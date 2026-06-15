"use client";

import { useState } from "react";
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
import { deleteAdminUser } from "@/lib/admin-client";
import { notifyError, notifySuccess } from "@/lib/toast";

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

  async function handleConfirm() {
    if (!userId) {
      return;
    }

    setDeleting(true);

    try {
      await deleteAdminUser(userId);
      onOpenChange(false);
      onDeleted?.();
      notifySuccess(fullName ? `Removed ${fullName}` : "User removed");
    } catch (deleteError) {
      notifyError(deleteError, "Failed to delete user");
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
