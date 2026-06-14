"use client";

import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LoanPaymentHistory } from "@/components/loans/loan-payment-history";
import { TrustBadge } from "@/components/loans/trust-badge";
import { formatCurrency } from "@/lib/loans";
import type { Loan } from "@/lib/loans-client";
import {
  LOAN_SORT_FIELDS,
  type LoanSortField,
  type LoanSortOrder,
} from "@/lib/loan-sort";

const SORT_LABELS: Record<LoanSortField, string> = {
  clientName: "Client",
  totalAmount: "Total",
  amountPaid: "Paid",
  outstanding: "Outstanding",
  loanDate: "Date",
  clientTrust: "Trust",
};

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
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2">
      <label htmlFor="loan-mobile-sort" className="shrink-0 text-sm text-muted-foreground">
        Sort
      </label>
      <select
        id="loan-mobile-sort"
        value={sortBy}
        onChange={(event) => onSort(event.target.value as LoanSortField)}
        className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {LOAN_SORT_FIELDS.map((field) => (
          <option key={field} value={field}>
            {SORT_LABELS[field]}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={onToggleOrder}
        aria-label={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
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
}: {
  loan: Loan;
  onDelete: (loan: Loan) => void;
  onPaymentsChanged?: () => void;
}) {
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
            {format(new Date(loan.loanDate), "MMM d, yyyy")}
          </p>
        </div>
        <TrustBadge trusted={loan.clientTrust} />
      </div>

      <dl className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Total</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{formatCurrency(loan.totalAmount)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Paid</dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {formatCurrency(loan.amountPaid)}
            {loan.paymentCount > 0 ? (
              <span className="ml-1 text-xs text-muted-foreground">
                ({loan.paymentCount})
              </span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Due</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{formatCurrency(loan.outstanding)}</dd>
        </div>
      </dl>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full justify-between"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        Payment history
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
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => onDelete(loan)}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5 text-destructive" />
          Delete
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
