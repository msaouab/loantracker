"use client";

import { useCallback, useState } from "react";
import { Pencil } from "lucide-react";
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
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useResetOnClose } from "@/hooks/use-reset-on-close";
import { dateParamToIso, formatDateParam } from "@/lib/dates";
import { formatCurrency } from "@/lib/loans";
import {
  updateLoanPayment,
  type LoanPayment,
} from "@/lib/loan-payments-client";

type EditPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  payment: LoanPayment;
  maxAmount: number;
  onUpdated?: () => void;
};

function paymentFormState(payment: LoanPayment) {
  return {
    amount: String(payment.amount),
    paidAt: formatDateParam(new Date(payment.paidAt)),
    note: payment.note ?? "",
  };
}

export function EditPaymentDialog({
  open,
  onOpenChange,
  loanId,
  payment,
  maxAmount,
  onUpdated,
}: EditPaymentDialogProps) {
  const [amount, setAmount] = useState(() => paymentFormState(payment).amount);
  const [paidAt, setPaidAt] = useState(() => paymentFormState(payment).paidAt);
  const [note, setNote] = useState(() => paymentFormState(payment).note);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetError = useCallback(() => setError(null), []);
  useResetOnClose(open, resetError);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedAmount = Math.round(Number(amount));
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter a valid payment amount");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateLoanPayment(loanId, payment.id, {
        amount: parsedAmount,
        paidAt: dateParamToIso(paidAt),
        note: note.trim() || undefined,
      });
      onOpenChange(false);
      onUpdated?.();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to update payment"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="data-[size=default]:max-w-md data-[size=default]:sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Pencil />
            </AlertDialogMedia>
            <AlertDialogTitle>Edit payment</AlertDialogTitle>
            <AlertDialogDescription>
              Update the {formatCurrency(payment.amount)} payment record.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-3 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-payment-amount">Amount</Label>
              <Input
                id="edit-payment-amount"
                type="number"
                min="1"
                step="1"
                max={maxAmount}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-payment-date">Payment date</Label>
              <DatePicker
                id="edit-payment-date"
                value={paidAt}
                onChange={setPaidAt}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-payment-note">Note (optional)</Label>
              <Textarea
                id="edit-payment-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
