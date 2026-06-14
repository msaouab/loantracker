"use client";

import { useCallback, useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrustBadge } from "@/components/loans/trust-badge";
import { useResetOnClose } from "@/hooks/use-reset-on-close";
import { formatCurrency } from "@/lib/loans";
import {
  fetchDeletedLoans,
  restoreLoan,
  type LoanRecord,
} from "@/lib/loans-client";

const SKELETON_ROWS = 3;

function DeletedLoansTableSkeleton() {
  return (
    <>
      {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-10 rounded-md" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-8 w-20 rounded-lg" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function DeletedLoans() {
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loanToRestore, setLoanToRestore] = useState<LoanRecord | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const resetRestoreError = useCallback(() => setRestoreError(null), []);
  useResetOnClose(!!loanToRestore, resetRestoreError);

  const applyLoans = useCallback((data: Awaited<ReturnType<typeof fetchDeletedLoans>>) => {
    setLoans(data.loans);
    setError(null);
  }, []);

  const refreshLoans = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchDeletedLoans();
      applyLoans(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load deleted loans"
      );
    } finally {
      setLoading(false);
    }
  }, [applyLoans]);

  useEffect(() => {
    let cancelled = false;

    void fetchDeletedLoans()
      .then((data) => {
        if (cancelled) return;
        applyLoans(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load deleted loans"
        );
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applyLoans]);

  async function handleConfirmRestore() {
    if (!loanToRestore) {
      return;
    }

    setRestoring(true);
    setRestoreError(null);

    try {
      await restoreLoan(loanToRestore.id);
      setLoans((current) =>
        current.filter((loan) => loan.id !== loanToRestore.id)
      );
      setLoanToRestore(null);
      toast.success(`Restored loan for ${loanToRestore.clientName}`);
    } catch (err) {
      setRestoreError(
        err instanceof Error ? err.message : "Failed to restore loan"
      );
    } finally {
      setRestoring(false);
    }
  }

  return (
    <>
      <Card
        id="deleted-loans"
        className="surface-card border-0 ring-1 ring-foreground/10"
      >
        <CardHeader>
          <CardTitle>Deleted loans</CardTitle>
          <CardDescription>
            Deleted loans are kept for 30 days, then permanently removed. Restore
            them here with their full payment history before that window ends.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Separator />
          {error ? (
            <div className="space-y-3 px-4 py-6 sm:px-5">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void refreshLoans()}>
                Try again
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[960px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Trust</TableHead>
                    <TableHead>Deleted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <DeletedLoansTableSkeleton />
                  ) : loans.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No loans deleted in the last 30 days.
                      </TableCell>
                    </TableRow>
                  ) : (
                    loans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">
                          {loan.clientName}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {loan.description ?? "—"}
                        </TableCell>
                        <TableCell>{formatCurrency(loan.totalAmount)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-success tabular-nums">
                              {formatCurrency(loan.amountPaid)}
                            </span>
                            {loan.paymentCount && loan.paymentCount > 0 ? (
                              <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                {loan.paymentCount}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-destructive tabular-nums">
                          {formatCurrency(loan.outstanding)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(loan.loanDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <TrustBadge trusted={loan.clientTrust} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {loan.deletedAt
                            ? formatDistanceToNow(new Date(loan.deletedAt), {
                                addSuffix: true,
                              })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLoanToRestore(loan)}
                          >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                            Restore
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!loanToRestore}
        onOpenChange={(open) => {
          if (!open) {
            setLoanToRestore(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-primary/10 text-primary">
              <RotateCcw />
            </AlertDialogMedia>
            <AlertDialogTitle>Restore loan?</AlertDialogTitle>
            <AlertDialogDescription>
              {loanToRestore
                ? `This will restore the loan for ${loanToRestore.clientName} and return it to your active loan list with all payment history.`
                : "This will restore the loan and return it to your active loan list."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {restoreError ? (
            <p className="text-sm text-destructive">{restoreError}</p>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Cancel</AlertDialogCancel>
            <Button disabled={restoring || !loanToRestore} onClick={handleConfirmRestore}>
              {restoring ? "Restoring..." : "Restore"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
