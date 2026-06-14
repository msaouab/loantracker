"use client";

import { useCallback, useState } from "react";
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
import { useResetOnClose } from "@/hooks/use-reset-on-close";
import { deleteLoan } from "@/lib/loans-client";

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
  const [error, setError] = useState<string | null>(null);

  const resetError = useCallback(() => setError(null), []);
  useResetOnClose(open, resetError);

  async function handleConfirm() {
    if (!loanId) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteLoan(loanId);
      onOpenChange(false);
      onDeleted?.();

      if (redirectTo) {
        router.push(redirectTo);
      }

      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete loan"
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
          <AlertDialogTitle>Delete loan record?</AlertDialogTitle>
          <AlertDialogDescription>
            {clientName
              ? `This loan for ${clientName} will be moved to Deleted loans in Settings. Deleted loans are kept for 30 days, then permanently removed. You can restore it during that window.`
              : "This loan will be moved to Deleted loans in Settings. Deleted loans are kept for 30 days, then permanently removed. You can restore it during that window."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

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
