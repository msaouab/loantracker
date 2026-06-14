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
import { formatCurrency } from "@/lib/loans";
import {
  deleteLoanPayment,
  type LoanPayment,
} from "@/lib/loan-payments-client";

type DeletePaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  clientName: string;
  payment: LoanPayment | null;
  onDeleted?: () => void;
};

export function DeletePaymentDialog({
  open,
  onOpenChange,
  loanId,
  clientName,
  payment,
  onDeleted,
}: DeletePaymentDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetError = useCallback(() => setError(null), []);
  useResetOnClose(open, resetError);

  async function handleConfirm() {
    if (!payment) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteLoanPayment(loanId, payment.id);
      onOpenChange(false);
      onDeleted?.();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete payment"
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
          <AlertDialogTitle>Delete payment?</AlertDialogTitle>
          <AlertDialogDescription>
            {payment ? (
              <>
                This will remove the{" "}
                <strong className="font-semibold text-foreground">
                  {formatCurrency(payment.amount)}
                </strong>{" "}
                payment for{" "}
                <strong className="font-semibold text-foreground">
                  {clientName}
                </strong>{" "}
                from the loan history. The total paid amount will be recalculated.
              </>
            ) : (
              <>
                This will remove the payment for{" "}
                <strong className="font-semibold text-foreground">
                  {clientName}
                </strong>{" "}
                from the loan history.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deleting || !payment}
            onClick={handleConfirm}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
