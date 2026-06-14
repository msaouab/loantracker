"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Banknote, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { DeletePaymentDialog } from "@/components/loans/delete-payment-dialog";
import { EditPaymentDialog } from "@/components/loans/edit-payment-dialog";
import { dateParamToIso, todayDateParam } from "@/lib/dates";
import { formatCurrency } from "@/lib/loans";
import {
  createLoanPayment,
  fetchLoanPayments,
  type LoanPayment,
} from "@/lib/loan-payments-client";

type LoanPaymentHistoryProps = {
  loanId: string;
  clientName: string;
  initialPayments?: LoanPayment[];
  initialOutstanding?: number;
  onPaymentsChanged?: () => void;
};

export function LoanPaymentHistory({
  loanId,
  clientName,
  initialPayments,
  initialOutstanding,
  onPaymentsChanged,
}: LoanPaymentHistoryProps) {
  const hasInitialData = initialPayments !== undefined;

  const [payments, setPayments] = useState<LoanPayment[]>(
    initialPayments ?? []
  );
  const [outstanding, setOutstanding] = useState(initialOutstanding ?? 0);
  const [loading, setLoading] = useState(!hasInitialData);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [addDate, setAddDate] = useState(todayDateParam());
  const [addNote, setAddNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<LoanPayment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<LoanPayment | null>(
    null
  );

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchLoanPayments(loanId);
      setPayments(data.payments);
      setOutstanding(data.outstanding);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load payment history"
      );
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    if (hasInitialData) {
      return;
    }

    let cancelled = false;

    void fetchLoanPayments(loanId)
      .then((data) => {
        if (cancelled) return;
        setPayments(data.payments);
        setOutstanding(data.outstanding);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load payment history"
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasInitialData, loanId]);

  async function handleAddPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Math.round(Number(addAmount));

    if (!amount || amount <= 0) {
      setError("Enter a valid payment amount");
      return;
    }

    setAdding(true);
    setError(null);

    try {
      await createLoanPayment(loanId, {
        amount,
        paidAt: dateParamToIso(addDate),
        note: addNote.trim() || undefined,
      });
      setAddAmount("");
      setAddNote("");
      setAddDate(todayDateParam());
      setShowAddForm(false);
      await loadPayments();
      onPaymentsChanged?.();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to record payment"
      );
    } finally {
      setAdding(false);
    }
  }

  function handlePaymentUpdated() {
    loadPayments();
    onPaymentsChanged?.();
  }

  if (loading) {
    return (
      <div className="space-y-3 py-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Payment history</p>
          <p className="text-xs text-muted-foreground">
            {payments.length} payment{payments.length === 1 ? "" : "s"} recorded
            {outstanding > 0
              ? ` · ${formatCurrency(outstanding)} remaining`
              : " · fully paid"}
          </p>
        </div>
        {outstanding > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm((current) => !current)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {showAddForm ? "Cancel" : "Record payment"}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {showAddForm ? (
        <form
          onSubmit={handleAddPayment}
          className="grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-4 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor={`payment-amount-${loanId}`}>Amount</Label>
            <Input
              id={`payment-amount-${loanId}`}
              type="number"
              min="1"
              step="1"
              max={outstanding}
              value={addAmount}
              onChange={(event) => setAddAmount(event.target.value)}
              placeholder={`Max ${formatCurrency(outstanding)}`}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`payment-date-${loanId}`}>Payment date</Label>
            <DatePicker
              id={`payment-date-${loanId}`}
              value={addDate}
              onChange={setAddDate}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`payment-note-${loanId}`}>Note (optional)</Label>
            <Textarea
              id={`payment-note-${loanId}`}
              value={addNote}
              onChange={(event) => setAddNote(event.target.value)}
              rows={2}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={adding}>
              {adding ? "Saving..." : "Save payment"}
            </Button>
          </div>
        </form>
      ) : null}

      {payments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/70 px-4 py-8 text-center">
          <Banknote className="h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            No payments recorded yet for {clientName}.
          </p>
          {outstanding > 0 && !showAddForm ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Record first payment
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Note</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-border/40 last:border-0"
                >
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {format(new Date(payment.paidAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-3 py-2.5 font-medium tabular-nums">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {payment.note || "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setPaymentToEdit(payment)}
                        aria-label={`Edit payment of ${formatCurrency(payment.amount)}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setPaymentToDelete(payment)}
                        aria-label={`Delete payment of ${formatCurrency(payment.amount)}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paymentToEdit ? (
        <EditPaymentDialog
          key={paymentToEdit.id}
          open
          onOpenChange={(open) => {
            if (!open) {
              setPaymentToEdit(null);
            }
          }}
          loanId={loanId}
          payment={paymentToEdit}
          maxAmount={outstanding + paymentToEdit.amount}
          onUpdated={handlePaymentUpdated}
        />
      ) : null}

      <DeletePaymentDialog
        open={paymentToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentToDelete(null);
          }
        }}
        loanId={loanId}
        clientName={clientName}
        payment={paymentToDelete}
        onDeleted={handlePaymentUpdated}
      />
    </div>
  );
}
