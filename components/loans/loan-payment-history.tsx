"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Banknote, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DeletePaymentDialog } from "@/components/loans/delete-payment-dialog";
import { EditPaymentDialog } from "@/components/loans/edit-payment-dialog";
import { dateParamToIso, todayDateParam } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { formatCurrency } from "@/lib/loans";
import type { AppLocale } from "@/lib/locale";
import { formatPaymentNote } from "@/lib/payment-display";
import {
  createLoanPayment,
  fetchLoanPayments,
  type LoanPayment,
} from "@/lib/loan-payments-client";
import { notifyError, notifySuccess } from "@/lib/toast";

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
  const locale = useLocale() as AppLocale;
  const t = useTranslations("loans");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const hasInitialData = initialPayments !== undefined;

  const [payments, setPayments] = useState<LoanPayment[]>(
    initialPayments ?? []
  );
  const [outstanding, setOutstanding] = useState(initialOutstanding ?? 0);
  const [loading, setLoading] = useState(!hasInitialData);
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

    try {
      const data = await fetchLoanPayments(loanId);
      setPayments(data.payments);
      setOutstanding(data.outstanding);
    } catch (loadError) {
      notifyError(loadError, t("failedLoadPayments"));
    } finally {
      setLoading(false);
    }
  }, [loanId, t]);

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
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        notifyError(loadError, t("failedLoadPayments"));
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasInitialData, loanId, t]);

  async function handleAddPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Math.round(Number(addAmount));

    if (!amount || amount <= 0) {
      notifyError(null, t("invalidAmount"));
      return;
    }

    if (amount > outstanding) {
      notifyError(
        null,
        tv("paymentExceedsOutstanding", {
          amount: formatCurrency(outstanding, locale),
        })
      );
      return;
    }

    setAdding(true);

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
      notifySuccess(t("paymentRecorded"));
    } catch (submitError) {
      notifyError(submitError, t("failedRecordPayment"));
    } finally {
      setAdding(false);
    }
  }

  function handlePaymentUpdated() {
    loadPayments();
    onPaymentsChanged?.();
  }

  const parsedAddAmount =
    addAmount.trim() === "" ? null : Math.round(Number(addAmount));
  const addAmountExceedsMax =
    parsedAddAmount !== null &&
    !Number.isNaN(parsedAddAmount) &&
    parsedAddAmount > outstanding;

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
          <p className="text-sm font-medium">{t("paymentHistory")}</p>
          <p className="text-xs text-muted-foreground">
            {t("paymentsCount", { count: payments.length })}
            {outstanding > 0 ? (
              <>
                {" · "}
                <span className="text-destructive">
                  {t("remaining", {
                    amount: formatCurrency(outstanding, locale),
                  })}
                </span>
              </>
            ) : (
              ` · ${t("fullyPaid")}`
            )}
          </p>
        </div>
        {outstanding > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm((current) => !current)}
          >
            {showAddForm ? (
              <Minus className="me-1.5 h-3.5 w-3.5" />
            ) : (
              <Plus className="me-1.5 h-3.5 w-3.5" />
            )}
            {showAddForm ? tc("cancel") : t("recordPayment")}
          </Button>
        ) : null}
      </div>

      {showAddForm ? (
        <form
          onSubmit={handleAddPayment}
          className="grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-4 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor={`payment-amount-${loanId}`}>{tc("amount")}</Label>
            <Input
              id={`payment-amount-${loanId}`}
              type="number"
              min="1"
              step="1"
              max={outstanding}
              value={addAmount}
              onChange={(event) => setAddAmount(event.target.value)}
              placeholder={t("maxAmount", {
                amount: formatCurrency(outstanding, locale),
              })}
              aria-invalid={addAmountExceedsMax}
              required
            />
            {addAmountExceedsMax ? (
              <p className="text-sm text-destructive" role="alert">
                {tv("paymentExceedsOutstanding", {
                  amount: formatCurrency(outstanding, locale),
                })}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`payment-date-${loanId}`}>{t("paymentDate")}</Label>
            <DatePicker
              id={`payment-date-${loanId}`}
              value={addDate}
              onChange={setAddDate}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`payment-note-${loanId}`}>{t("noteOptional")}</Label>
            <Textarea
              id={`payment-note-${loanId}`}
              value={addNote}
              onChange={(event) => setAddNote(event.target.value)}
              rows={2}
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              type="submit"
              size="sm"
              disabled={adding || addAmountExceedsMax}
            >
              {adding ? tc("saving") : t("savePayment")}
            </Button>
          </div>
        </form>
      ) : null}

      {payments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/70 px-4 py-8 text-center">
          <Banknote className="h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            {t("noPayments", { clientName })}
          </p>
          {outstanding > 0 && !showAddForm ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="me-1.5 h-3.5 w-3.5" />
              {t("recordFirstPayment")}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tc("date")}</TableHead>
                <TableHead>{tc("amount")}</TableHead>
                <TableHead>{tc("note")}</TableHead>
                <TableHead className="text-end">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const noteLabel = formatPaymentNote(
                  payment.note,
                  t("initialBalanceNote")
                );

                return (
                  <TableRow key={payment.id}>
                    <TableCell className="min-w-32 whitespace-normal">
                      {formatDate(payment.paidAt, locale)}
                    </TableCell>
                    <TableCell className="font-medium text-success tabular-nums">
                      {formatCurrency(payment.amount, locale)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {noteLabel ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setPaymentToEdit(payment)}
                          aria-label={t("editPaymentAria", {
                            amount: formatCurrency(payment.amount, locale),
                          })}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setPaymentToDelete(payment)}
                          aria-label={t("deletePaymentAria", {
                            amount: formatCurrency(payment.amount, locale),
                          })}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
