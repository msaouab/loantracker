"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { notifyError, notifySuccess } from "@/lib/toast";
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
import { formatDate, getDateFnsLocale } from "@/lib/format";
import { formatCurrency } from "@/lib/loans";
import type { AppLocale } from "@/lib/locale";
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
          <TableCell className="text-end">
            <Skeleton className="ms-auto h-8 w-20 rounded-lg" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function DeletedLoans() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loanToRestore, setLoanToRestore] = useState<LoanRecord | null>(null);
  const [restoring, setRestoring] = useState(false);

  const applyLoans = useCallback((data: Awaited<ReturnType<typeof fetchDeletedLoans>>) => {
    setLoans(data.loans);
    setLoadFailed(false);
  }, []);

  const refreshLoans = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);

    try {
      const data = await fetchDeletedLoans();
      applyLoans(data);
    } catch (err) {
      setLoadFailed(true);
      notifyError(err, t("failedLoadDeleted"));
    } finally {
      setLoading(false);
    }
  }, [applyLoans, t]);

  useEffect(() => {
    let cancelled = false;

    void fetchDeletedLoans()
      .then((data) => {
        if (cancelled) return;
        applyLoans(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadFailed(true);
        notifyError(err, t("failedLoadDeleted"));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applyLoans, t]);

  async function handleConfirmRestore() {
    if (!loanToRestore) {
      return;
    }

    setRestoring(true);

    try {
      await restoreLoan(loanToRestore.id);
      setLoans((current) =>
        current.filter((loan) => loan.id !== loanToRestore.id)
      );
      setLoanToRestore(null);
      notifySuccess(t("restoredNamed", { clientName: loanToRestore.clientName }));
    } catch (err) {
      notifyError(err, t("failedRestore"));
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
          <CardTitle>{t("deletedLoans")}</CardTitle>
          <CardDescription>{t("deletedLoansDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Separator />
          {loadFailed ? (
            <div className="flex justify-end px-4 py-3 sm:px-5">
              <Button variant="outline" size="sm" onClick={() => void refreshLoans()}>
                {tc("tryAgain")}
              </Button>
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <Table className="min-w-[960px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("columnClient")}</TableHead>
                    <TableHead>{tc("description")}</TableHead>
                    <TableHead>{t("columnTotal")}</TableHead>
                    <TableHead>{t("columnPaid")}</TableHead>
                    <TableHead>{t("columnOutstanding")}</TableHead>
                    <TableHead>{tc("date")}</TableHead>
                    <TableHead>{t("columnTrust")}</TableHead>
                    <TableHead>{t("columnDeleted")}</TableHead>
                    <TableHead className="text-end">{tc("actions")}</TableHead>
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
                        {t("noDeleted")}
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
                        <TableCell>{formatCurrency(loan.totalAmount, locale)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-success tabular-nums">
                              {formatCurrency(loan.amountPaid, locale)}
                            </span>
                            {loan.paymentCount && loan.paymentCount > 0 ? (
                              <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                {loan.paymentCount}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-destructive tabular-nums">
                          {formatCurrency(loan.outstanding, locale)}
                        </TableCell>
                        <TableCell>
                          {formatDate(loan.loanDate, locale)}
                        </TableCell>
                        <TableCell>
                          <TrustBadge trusted={loan.clientTrust} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {loan.deletedAt
                            ? formatDistanceToNow(new Date(loan.deletedAt), {
                                addSuffix: true,
                                locale: getDateFnsLocale(locale),
                              })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLoanToRestore(loan)}
                          >
                            <RotateCcw className="me-1.5 h-3.5 w-3.5" />
                            {tc("restore")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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
            <AlertDialogTitle>{t("restoreTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {loanToRestore
                ? t("restoreDescriptionNamed", { clientName: loanToRestore.clientName })
                : t("restoreDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>{tc("cancel")}</AlertDialogCancel>
            <Button disabled={restoring || !loanToRestore} onClick={handleConfirmRestore}>
              {restoring ? tc("restoring") : tc("restore")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
