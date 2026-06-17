"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { formatCurrency } from "@/lib/format";
import type { AppLocale } from "@/lib/locale";
import { deleteLoan } from "@/lib/loans-client";
import { notifyError, notifySuccess } from "@/lib/toast";

type DeleteLoanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string | null;
  clientName?: string;
  totalAmount?: number;
  onDeleted?: () => void;
  redirectTo?: string;
};

export function DeleteLoanDialog({
  open,
  onOpenChange,
  loanId,
  clientName,
  totalAmount,
  onDeleted,
  redirectTo,
}: DeleteLoanDialogProps) {
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const t = useTranslations("loans");
  const tc = useTranslations("common");
  const [deleting, setDeleting] = useState(false);

  const highlight = (chunks: React.ReactNode) => (
    <span className="font-semibold text-foreground">{chunks}</span>
  );

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
        clientName ? t("loanDeletedNamed", { clientName }) : t("loanDeleted")
      );

      if (redirectTo) {
        router.push(redirectTo);
      }

      router.refresh();
    } catch (deleteError) {
      notifyError(deleteError, t("failedDelete"));
    } finally {
      setDeleting(false);
    }
  }

  const description =
    clientName && totalAmount != null ? (
      t.rich("deleteDescriptionNamed", {
        clientName,
        amount: formatCurrency(totalAmount, locale),
        highlight,
      })
    ) : clientName ? (
      t.rich("deleteDescriptionNamedNoAmount", {
        clientName,
        highlight,
      })
    ) : (
      t("deleteDescription")
    );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{tc("cancel")}</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deleting || !loanId}
            onClick={handleConfirm}
          >
            {deleting ? tc("deleting") : tc("delete")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
