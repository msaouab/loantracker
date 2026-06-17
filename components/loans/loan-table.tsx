"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatRecoveredRetention } from "@/lib/loans";
import { formatDate } from "@/lib/format";
import type { AppLocale } from "@/lib/locale";
import type { LoanStatus } from "@/lib/loan-status";
import { DEFAULT_LOAN_SORT, type LoanSortField } from "@/lib/loan-sort-types";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { LoanEmptyState } from "@/components/loans/loan-empty-state";
import {
  LoanMobileCard,
  LoanMobileSkeleton,
  LoanMobileSort,
} from "@/components/loans/loan-mobile-list";
import { LoanTableShell, LoanTableSkeleton } from "@/components/loans/loan-table-skeleton";
import { DeleteLoanDialog } from "@/components/loans/delete-loan-dialog";
import { LoanPaymentHistory } from "@/components/loans/loan-payment-history";
import { TrustBadge } from "@/components/loans/trust-badge";
import {
  PageHeader,
  PageHeaderAction,
  PAGE_HEADER_TOOLBAR_CLASS,
} from "@/components/shared/page-header";
import { fetchLoanList, type Loan } from "@/lib/loans-client";
import { notifyError } from "@/lib/toast";
import {
  DEFAULT_LOAN_PAGE_SIZE,
  LOAN_PAGE_SIZE_OPTIONS,
  type LoanPageSize,
} from "@/lib/loan-list";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = LOAN_PAGE_SIZE_OPTIONS;
const DEFAULT_PAGE_SIZE = DEFAULT_LOAN_PAGE_SIZE;

type PageSize = LoanPageSize;

type LoanTableProps = {
  status?: LoanStatus;
  title?: string;
  emptyMessage?: string;
};

export function LoanTable({
  status = "active",
  title = "Loan Records",
  emptyMessage = "No loan records found.",
}: LoanTableProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("loans");
  const tc = useTranslations("common");
  const retentionLabels = useMemo(
    () => ({
      today: t("retentionToday"),
      oneDayAgo: t("retentionOneDayAgo"),
      daysAgo: (count: number) => t("retentionDaysAgo", { count }),
      deletesToday: t("retentionDeletesToday"),
      oneDayLeft: t("retentionOneDayLeft"),
      daysLeft: (count: number) => t("retentionDaysLeft", { count }),
    }),
    [t]
  );
  const [loans, setLoans] = useState<Loan[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<LoanSortField>(DEFAULT_LOAN_SORT.sortBy);
  const [sortOrder, setSortOrder] = useState(DEFAULT_LOAN_SORT.sortOrder);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<{
    id: string;
    clientName: string;
    totalAmount: number;
  } | null>(null);
  const [expandedLoanIds, setExpandedLoanIds] = useState<Set<string>>(
    () => new Set()
  );

  const loadLoans = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);

    try {
      const data = await fetchLoanList({
        page,
        pageSize,
        sortBy,
        sortOrder,
        status,
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setLoans(data.loans);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (loadError) {
      setLoadFailed(true);
      notifyError(loadError, t("failedLoad"));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, dateFrom, dateTo, sortBy, sortOrder, status, t]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadLoans();
    }, 300);
    return () => clearTimeout(timeout);
  }, [loadLoans]);

  function requestDelete(loan: Loan) {
    setLoanToDelete({
      id: loan.id,
      clientName: loan.clientName,
      totalAmount: loan.totalAmount,
    });
  }

  function toggleExpanded(loanId: string) {
    setExpandedLoanIds((current) => {
      const next = new Set(current);
      if (next.has(loanId)) {
        next.delete(loanId);
      } else {
        next.add(loanId);
      }
      return next;
    });
  }

  const hasActiveFilters = Boolean(search || dateFrom || dateTo);

  function handleSort(field: LoanSortField) {
    if (sortBy === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder(field === "clientName" ? "asc" : "desc");
    }
    setPage(1);
  }

  function handleMobileSort(field: LoanSortField) {
    if (field === sortBy) return;
    setSortBy(field);
    setSortOrder(field === "clientName" ? "asc" : "desc");
    setPage(1);
  }

  function handleToggleSortOrder() {
    setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const emptyState = !loading && !loadFailed && loans.length === 0 && (
    <LoanEmptyState
      status={status}
      message={emptyMessage}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
    />
  );

  const description = loading
    ? t("loadingPortfolio")
    : loadFailed
      ? t("unableToLoad")
      : status === "completed"
        ? `${t("recordsCount", { total })}${t("recoveredRetentionSuffix")}${hasActiveFilters ? t("matchingFilters") : ""}`
        : `${t("recordsCount", { total })}${hasActiveFilters ? t("matchingFilters") : ""}`;

  return (
    <div className="space-y-4">
      <PageHeader
        title={title}
        description={description}
        toolbar={
          <div className={PAGE_HEADER_TOOLBAR_CLASS}>
            <div className="relative min-w-0 flex-1">
              <Search className="absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 border-border/70 bg-muted/20 ps-9"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>

            <Separator orientation="vertical" className="hidden h-9 sm:block" />

            <DateRangePicker
              from={dateFrom}
              to={dateTo}
              onFromChange={(value) => {
                setDateFrom(value);
                setPage(1);
              }}
              onToChange={(value) => {
                setDateTo(value);
                setPage(1);
              }}
              onClear={() => {
                setDateFrom("");
                setDateTo("");
                setPage(1);
              }}
            />
          </div>
        }
      >
        <PageHeaderAction
          href="/loans/new"
          label={t("addNewLoan")}
          icon={Plus}
          className="shadow-sm shadow-primary/20"
        />
      </PageHeader>

      {loadFailed ? (
        <div className="flex justify-end px-4 pb-2 sm:px-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => loadLoans()}
          >
            <RefreshCw
              className={cn("me-1.5 h-3.5 w-3.5", loading && "animate-spin")}
            />
            {loading ? tc("retrying") : tc("retry")}
          </Button>
        </div>
      ) : null}

      <div className="hidden md:block">
        {loading ? (
          <LoanTableShell
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            showRecoveredAt={status === "completed"}
          >
            <LoanTableSkeleton showRecoveredAt={status === "completed"} />
          </LoanTableShell>
        ) : loans.length === 0 ? (
          emptyState
        ) : (
          <LoanTableShell
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            showRecoveredAt={status === "completed"}
          >
              {loans.map((loan) => {
                const isExpanded = expandedLoanIds.has(loan.id);

                return (
                  <Fragment key={loan.id}>
                    <TableRow
                      className={cn(
                        "cursor-pointer",
                        isExpanded && "bg-muted/30"
                      )}
                      onClick={() => toggleExpanded(loan.id)}
                      aria-expanded={isExpanded}
                    >
                      <TableCell className="w-10 px-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleExpanded(loan.id);
                          }}
                          aria-expanded={isExpanded}
                          aria-label={
                            isExpanded
                              ? t("hidePaymentHistory", { clientName: loan.clientName })
                              : t("showPaymentHistory", { clientName: loan.clientName })
                          }
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/loans/${loan.id}`}
                          className="hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {loan.clientName}
                        </Link>
                      </TableCell>
                      <TableCell>{formatCurrency(loan.totalAmount, locale)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-success tabular-nums">
                            {formatCurrency(loan.amountPaid, locale)}
                          </span>
                          {loan.paymentCount > 0 ? (
                            <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                              {loan.paymentCount}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-destructive tabular-nums">
                        {formatCurrency(loan.outstanding, locale)}
                      </TableCell>
                      <TableCell>{formatDate(loan.loanDate, locale)}</TableCell>
                      <TableCell>
                        <TrustBadge trusted={loan.clientTrust} />
                      </TableCell>
                      {status === "completed" ? (
                        <TableCell className="text-sm text-muted-foreground">
                          {formatRecoveredRetention(loan.recoveredAt ?? null, locale, retentionLabels) ?? "—"}
                        </TableCell>
                      ) : null}
                      <TableCell className="text-end" onClick={(event) => event.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/loans/${loan.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => requestDelete(loan)}
                            aria-label={t("deleteLoanAria", { clientName: loan.clientName })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded ? (
                      <TableRow>
                        <TableCell colSpan={status === "completed" ? 9 : 8} className="bg-muted/15 px-6 py-4">
                          <LoanPaymentHistory
                            loanId={loan.id}
                            clientName={loan.clientName}
                            onPaymentsChanged={loadLoans}
                          />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })}
          </LoanTableShell>
        )}
      </div>

      <div className="space-y-3 md:hidden">
        <LoanMobileSort
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleMobileSort}
          onToggleOrder={handleToggleSortOrder}
        />
        {loading ? (
          <LoanMobileSkeleton />
        ) : loans.length === 0 ? (
          emptyState
        ) : (
          loans.map((loan) => (
            <LoanMobileCard
              key={loan.id}
              loan={loan}
              onDelete={requestDelete}
              onPaymentsChanged={loadLoans}
              showRecoveredAt={status === "completed"}
            />
          ))
        )}
      </div>

      {!loading && total > 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            {tc("previous")}
          </Button>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <span
                id="loan-page-size-label"
                className="text-sm text-muted-foreground whitespace-nowrap"
              >
                {t("rowsPerPage")}
              </span>
              <Dropdown
                id="loan-page-size"
                aria-label={t("rowsPerPage")}
                value={String(pageSize)}
                options={PAGE_SIZE_OPTIONS.map((size) => ({
                  value: String(size),
                  label: String(size),
                }))}
                onValueChange={(value) => {
                  setPageSize(Number(value) as PageSize);
                  setPage(1);
                }}
                className="h-8 w-16"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {t("pageOf", { page, totalPages })}
            </span>
          </div>

          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            {tc("next")}
          </Button>
        </div>
      ) : null}

      <DeleteLoanDialog
        open={loanToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLoanToDelete(null);
          }
        }}
        loanId={loanToDelete?.id ?? null}
        clientName={loanToDelete?.clientName}
        totalAmount={loanToDelete?.totalAmount}
        onDeleted={loadLoans}
      />
    </div>
  );
}
