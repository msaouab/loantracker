"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { Skeleton } from "@/components/ui/skeleton";
import { LoanPaymentHistory } from "@/components/loans/loan-payment-history";
import { TrustBadge } from "@/components/loans/trust-badge";
import { formatDate } from "@/lib/format";
import { formatCurrency, formatRecoveredRetention } from "@/lib/loans";
import type { AppLocale } from "@/lib/locale";
import type { Loan } from "@/lib/loans-client";
import type { LoanSortField, LoanSortOrder } from "@/lib/loan-sort-types";
import { LOAN_SORT_FIELDS } from "@/lib/loan-sort-types";

const SORT_KEYS: Record<LoanSortField, "sortClient" | "sortTotal" | "sortPaid" | "sortOutstanding" | "sortDate" | "sortTrust"> = {
  clientName: "sortClient",
  totalAmount: "sortTotal",
  amountPaid: "sortPaid",
  outstanding: "sortOutstanding",
  loanDate: "sortDate",
  clientTrust: "sortTrust",
};

function useRetentionLabels() {
  const t = useTranslations("loans");
  return {
    today: t("retentionToday"),
    oneDayAgo: t("retentionOneDayAgo"),
    daysAgo: (count: number) => t("retentionDaysAgo", { count }),
    deletesToday: t("retentionDeletesToday"),
    oneDayLeft: t("retentionOneDayLeft"),
    daysLeft: (count: number) => t("retentionDaysLeft", { count }),
  };
}

export function LoanMobileSort({
  sortBy,
  sortOrder,
  onSort,
  onToggleOrder,
}: {
  sortBy: LoanSortField;
  sortOrder: LoanSortOrder;
  onSort: (field: LoanSortField) => void;
  onToggleOrder: () => void;
}) {
  const t = useTranslations("loans");

  const sortOptions = useMemo(
    () =>
      LOAN_SORT_FIELDS.map((field) => ({
        value: field,
        label: t(SORT_KEYS[field]),
      })),
    [t]
  );

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2">
      <span className="shrink-0 text-sm text-muted-foreground">
        {t("sortLabel")}
      </span>
      <DropdownSelect
        id="loan-mobile-sort"
        aria-label={t("sortLabel")}
        value={sortBy}
        options={sortOptions}
        onValueChange={(value) => onSort(value as LoanSortField)}
        className="h-9 min-w-0 flex-1"
      />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={onToggleOrder}
        aria-label={
          sortOrder === "asc" ? t("sortDescending") : t("sortAscending")
        }
      >
        {sortOrder === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export function LoanMobileCard({
  loan,
  onDelete,
  onPaymentsChanged,
  showRecoveredAt = false,
}: {
  loan: Loan;
  onDelete: (loan: Loan) => void;
  onPaymentsChanged?: () => void;
  showRecoveredAt?: boolean;
}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("loans");
  const tc = useTranslations("common");
  const retentionLabels = useRetentionLabels();
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="surface-card space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Link
            href={`/loans/${loan.id}`}
            className="block truncate text-base font-semibold hover:underline"
          >
            {loan.clientName}
          </Link>
          <p className="text-sm text-muted-foreground">
            {formatDate(loan.loanDate, locale)}
          </p>
        </div>
        <TrustBadge trusted={loan.clientTrust} />
      </div>

      <dl className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">{t("labelTotal")}</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{formatCurrency(loan.totalAmount, locale)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("labelPaid")}</dt>
          <dd className="mt-0.5 font-medium text-success tabular-nums">
            {formatCurrency(loan.amountPaid, locale)}
            {loan.paymentCount > 0 ? (
              <span className="ms-1 text-xs text-muted-foreground">
                ({loan.paymentCount})
              </span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("labelDue")}</dt>
          <dd className="mt-0.5 font-medium text-destructive tabular-nums">
            {formatCurrency(loan.outstanding, locale)}
          </dd>
        </div>
      </dl>

      {showRecoveredAt ? (
        <p className="text-sm text-muted-foreground">
          {formatRecoveredRetention(loan.recoveredAt ?? null, locale, retentionLabels) ??
            t("recoveryDateUnavailable")}
        </p>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full justify-between"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        {t("paymentHistory")}
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {expanded ? (
        <LoanPaymentHistory
          loanId={loan.id}
          clientName={loan.clientName}
          onPaymentsChanged={onPaymentsChanged}
        />
      ) : null}

      <div className="flex justify-end gap-2 border-t border-border/60 pt-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/loans/${loan.id}/edit`}>
            <Pencil className="me-1.5 h-3.5 w-3.5" />
            {tc("edit")}
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => onDelete(loan)}>
          <Trash2 className="me-1.5 h-3.5 w-3.5 text-destructive" />
          {tc("delete")}
        </Button>
      </div>
    </article>
  );
}

export function LoanMobileSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="surface-card space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-5 w-12" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex justify-end gap-2 border-t border-border/60 pt-3">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </>
  );
}
