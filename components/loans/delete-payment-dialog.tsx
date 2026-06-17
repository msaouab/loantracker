"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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
import type { AppLocale } from "@/lib/locale";
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
  const locale = useLocale() as AppLocale;
  const t = useTranslations("loans");
  const tc = useTranslations("common");
  const [deleting, setDeleting] = useState(false);

  const highlight = (chunks: React.ReactNode) => (
    <span className="font-semibold text-foreground">{chunks}</span>
  );

  const description =
    payment != null
      ? t.rich("deletePaymentDescriptionAmount", {
          amount: formatCurrency(payment.amount, locale),
          clientName,
          highlight,
        })
      : t.rich("deletePaymentDescription", {
          clientName,
          highlight,
        });

  async function handleConfirm() {
    if (!payment) {
      return;
    }

    setDeleting(true);

    try {
      await deleteLoanPayment(loanId, payment.id);
      onOpenChange(false);
      onDeleted?.();
      notifySuccess(
        t("paymentDeleted", { amount: formatCurrency(payment.amount, locale) })
      );
    } catch (deleteError) {
      notifyError(deleteError, t("failedDeletePayment"));
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
          <AlertDialogTitle>{t("deletePaymentTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{tc("cancel")}</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deleting || !payment}
            onClick={handleConfirm}
          >
            {deleting ? tc("deleting") : tc("delete")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
