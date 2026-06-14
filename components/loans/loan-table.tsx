"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatRecoveredRetention } from "@/lib/loans";
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
  const [error, setError] = useState<string | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<{
    id: string;
    clientName: string;
  } | null>(null);
  const [expandedLoanIds, setExpandedLoanIds] = useState<Set<string>>(
    () => new Set()
  );

  const loadLoans = useCallback(async () => {
    setLoading(true);
    setError(null);

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
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load loans"
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, dateFrom, dateTo, sortBy, sortOrder, status]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadLoans();
    }, 300);
    return () => clearTimeout(timeout);
  }, [loadLoans]);

  function requestDelete(loan: Loan) {
    setLoanToDelete({ id: loan.id, clientName: loan.clientName });
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

  const emptyState = !loading && !error && loans.length === 0 && (
    <LoanEmptyState
      status={status}
      message={emptyMessage}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
    />
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title={title}
        description={
          loading
            ? "Loading portfolio..."
            : error
              ? "Unable to load portfolio"
              : status === "completed"
                ? `${total} record${total === 1 ? "" : "s"} · removed 30 days after full payment${hasActiveFilters ? " matching filters" : ""}`
                : `${total} record${total === 1 ? "" : "s"}${hasActiveFilters ? " matching filters" : ""}`
        }
        toolbar={
          <div className={PAGE_HEADER_TOOLBAR_CLASS}>
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 border-border/70 bg-muted/20 pl-9"
                placeholder="Search client or amount..."
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
          label="Add New Loan"
          icon={Plus}
          className="shadow-sm shadow-primary/20"
        />
      </PageHeader>

      {error ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-destructive/30"
            disabled={loading}
            onClick={() => loadLoans()}
          >
            <RefreshCw
              className={cn("mr-1.5 h-3.5 w-3.5", loading && "animate-spin")}
            />
            {loading ? "Retrying..." : "Retry"}
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
                    <TableRow>
                      <TableCell className="w-10 px-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => toggleExpanded(loan.id)}
                          aria-expanded={isExpanded}
                          aria-label={
                            isExpanded
                              ? `Hide payment history for ${loan.clientName}`
                              : `Show payment history for ${loan.clientName}`
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
                        <Link href={`/loans/${loan.id}`} className="hover:underline">
                          {loan.clientName}
                        </Link>
                      </TableCell>
                      <TableCell>{formatCurrency(loan.totalAmount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-success tabular-nums">
                            {formatCurrency(loan.amountPaid)}
                          </span>
                          {loan.paymentCount > 0 ? (
                            <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                              {loan.paymentCount}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-destructive tabular-nums">
                        {formatCurrency(loan.outstanding)}
                      </TableCell>
                      <TableCell>{format(new Date(loan.loanDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <TrustBadge trusted={loan.clientTrust} />
                      </TableCell>
                      {status === "completed" ? (
                        <TableCell className="text-sm text-muted-foreground">
                          {formatRecoveredRetention(loan.recoveredAt ?? null) ?? "—"}
                        </TableCell>
                      ) : null}
                      <TableCell className="text-right">
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
                            aria-label={`Delete loan for ${loan.clientName}`}
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
            Previous
          </Button>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <label
                htmlFor="loan-page-size"
                className="text-sm text-muted-foreground whitespace-nowrap"
              >
                Rows per page
              </label>
              <select
                id="loan-page-size"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value) as PageSize);
                  setPage(1);
                }}
                className="h-8 w-16 shrink-0 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
          </div>

          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
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
        onDeleted={loadLoans}
      />
    </div>
  );
}
