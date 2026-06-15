"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { deleteLoan } from "@/lib/loans-client";
import { notifyError, notifySuccess } from "@/lib/toast";

type DeleteLoanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string | null;
  clientName?: string;
  onDeleted?: () => void;
  redirectTo?: string;
};

export function DeleteLoanDialog({
  open,
  onOpenChange,
  loanId,
  clientName,
  onDeleted,
  redirectTo,
}: DeleteLoanDialogProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    if (!loanId) {
      return;
    }

    setDeleting(true);

    try {
      await deleteLoan(loanId);
      onOpenChange(false);
      onDeleted?.();
      notifySuccess(
        clientName ? `Deleted loan for ${clientName}` : "Loan deleted"
      );

      if (redirectTo) {
        router.push(redirectTo);
      }

      router.refresh();
    } catch (deleteError) {
      notifyError(deleteError, "Failed to delete loan");
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
          <AlertDialogTitle>Delete loan record?</AlertDialogTitle>
          <AlertDialogDescription>
            {clientName
              ? `This loan for ${clientName} will be moved to Deleted loans in Settings. Deleted loans are kept for 30 days, then permanently removed. You can restore it during that window.`
              : "This loan will be moved to Deleted loans in Settings. Deleted loans are kept for 30 days, then permanently removed. You can restore it during that window."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deleting || !loanId}
            onClick={handleConfirm}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
