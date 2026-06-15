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
import { formatCurrency } from "@/lib/loans";
import {
  deleteLoanPayment,
  type LoanPayment,
} from "@/lib/loan-payments-client";
import { notifyError, notifySuccess } from "@/lib/toast";

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

  async function handleConfirm() {
    if (!payment) {
      return;
    }

    setDeleting(true);

    try {
      await deleteLoanPayment(loanId, payment.id);
      onOpenChange(false);
      onDeleted?.();
      notifySuccess(`Deleted ${formatCurrency(payment.amount)} payment`);
    } catch (deleteError) {
      notifyError(deleteError, "Failed to delete payment");
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
